import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface CustomerStatementData {
  user: {
    id: string
    name: string
    phone: string
    email?: string | null
    isWholesale?: boolean
    balance: number
  }
  totalDebt: number
  debts: Array<{
    id: string
    totalAmount: number
    paidAmount: number
    dueDate?: string | null
    isPaid: boolean
    createdAt: string
    order?: {
      id: string
      totalAmount: number
      items: Array<{
        quantity: number
        unitPrice: number
        product: {
          name: string
          unit?: string
        }
      }>
    } | null
  }>
  orders: Array<{
    id: string
    totalAmount: number
    paymentType: string
    paymentStatus: string
    createdAt: string
    items: Array<{
      quantity: number
      unitPrice: number
      product: {
        name: string
      }
    }>
  }>
  transactions: Array<{
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    paymentMethod: string
    details?: string | null
    notes?: string | null
    createdAt: string
    account?: {
      name: string
    } | null
  }>
}

export function generateCustomerStatementPDF(data: CustomerStatementData) {
  const doc = new jsPDF()

  // Sarlavha (Header)
  doc.setFontSize(20)
  doc.setTextColor(255, 107, 53) // #FF6B35 Vibrant Orange
  doc.text('TEZ UP PRO', 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Tekstil va Ishlab chiqarish ERP tizimi', 14, 24)
  doc.text(`Sana: ${new Date().toLocaleString('uz-UZ')}`, 140, 24)

  doc.setDrawColor(230, 230, 230)
  doc.line(14, 28, 196, 28)

  // Mijoz / Do'kon ma'lumotlari
  doc.setFontSize(14)
  doc.setTextColor(30, 30, 30)
  doc.text(`Mijoz / Do'kon Akt-Sverkasi: ${data.user.name}`, 14, 37)

  doc.setFontSize(10)
  doc.setTextColor(70, 70, 70)
  doc.text(`Telefon: ${data.user.phone || '-' }`, 14, 44)
  doc.text(`Mijoz turi: ${data.user.isWholesale ? 'Ulgurji (B2B)' : 'Chakana (B2C)'}`, 14, 50)

  // Balans va qarz boxlari
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, 55, 85, 22, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Hozirgi Balans / Avans', 18, 62)
  doc.setFontSize(13)
  doc.setTextColor(data.user.balance >= 0 ? 34 : 220, data.user.balance >= 0 ? 139 : 38, 34)
  doc.text(`${new Intl.NumberFormat('uz-UZ').format(data.user.balance)} so'm`, 18, 71)

  doc.setFillColor(254, 242, 242)
  doc.roundedRect(105, 55, 85, 22, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setTextColor(150, 50, 50)
  doc.text('Jami Nasiya (Qarz)', 109, 62)
  doc.setFontSize(13)
  doc.setTextColor(220, 38, 38)
  doc.text(`${new Intl.NumberFormat('uz-UZ').format(data.totalDebt)} so'm`, 109, 71)

  let startY = 85

  // 1-JADVAL: Olingan Mahsulotlar va Nasiyalar
  doc.setFontSize(11)
  doc.setTextColor(255, 107, 53)
  doc.text('1. Berilgan Mahsulotlar va Nasiyalar Tarixi', 14, startY)

  const debtRows: any[] = []
  data.debts.forEach((d) => {
    const dateStr = new Date(d.createdAt).toLocaleDateString('uz-UZ')
    const itemsDetail = d.order?.items
      ? d.order.items.map((it) => `${it.product.name} (${it.quantity} dona/metr)`).join(', ')
      : 'Tafsilot yo\'q'
    const qoldiq = d.totalAmount - d.paidAmount

    debtRows.push([
      dateStr,
      itemsDetail,
      `${new Intl.NumberFormat('uz-UZ').format(d.totalAmount)} so'm`,
      `${new Intl.NumberFormat('uz-UZ').format(d.paidAmount)} so'm`,
      `${new Intl.NumberFormat('uz-UZ').format(qoldiq)} so'm`,
      d.isPaid ? 'To\'langan' : 'Nasiyada',
    ])
  })

  autoTable(doc, {
    startY: startY + 4,
    head: [['Sana', 'Mahsulotlar (metr / dona)', 'Umumiy Qiymat', 'To\'langan', 'Nasiya Qoldig\'i', 'Holat']],
    body: debtRows.length > 0 ? debtRows : [['-', 'Nasiya xaridlari mavjud emas', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
  })

  // 2-JADVAL: To'lovlar va Kassa Kirim-Chiqimlari
  const nextY = (doc as any).lastAutoTable.finalY + 12

  doc.setFontSize(11)
  doc.setTextColor(255, 107, 53)
  doc.text('2. To\'lovlar va Hisob-Kitob (Kassa) Harakatlari', 14, nextY)

  const txnRows: any[] = []
  data.transactions.forEach((tx) => {
    const dateStr = new Date(tx.createdAt).toLocaleDateString('uz-UZ')
    txnRows.push([
      dateStr,
      tx.type === 'INCOME' ? 'Kirim (To\'lov qabul qilindi)' : 'Chiqim (Qaytarildi / Berildi)',
      tx.account?.name || 'Kassa',
      tx.paymentMethod,
      `${tx.type === 'INCOME' ? '+' : '-'}${new Intl.NumberFormat('uz-UZ').format(tx.amount)} so'm`,
      tx.details || tx.notes || '-',
    ])
  })

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Sana', 'Harakat Turi', 'Kassa', 'To\'lov Usuli', 'Summa', 'Tafsilot / Izoh']],
    body: txnRows.length > 0 ? txnRows : [['-', 'To\'lov harakatlari topilmadi', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [70, 80, 95], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
  })

  // Imzo va Muhr qismi
  const finalY = (doc as any).lastAutoTable.finalY + 20
  if (finalY < 260) {
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text('Boshqaruvchi Imzosi: ___________________', 14, finalY)
    doc.text('Mijoz Imzosi: ___________________', 120, finalY)
  }

  // PDF ni saqlash / yuklab olish
  const fileName = `Akt_sverka_${data.user.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}