# Tez Up Pro 🧵

**Production-Ready ERP | CRM | E-Commerce for Textile & Soft-Goods Manufacturing**

> Mobile-first web application built with Next.js 14, PostgreSQL, Prisma ORM.
> White + Orange design system. Role-based access: Admin, Employee, Courier, Customer.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker + Docker Compose (for PostgreSQL)
- An [Eskiz.uz](https://eskiz.uz) account for SMS

### 1. Clone & Install
`ash
git clone <your-repo-url> tez-up-pro
cd tez-up-pro
npm install
`

### 2. Configure Environment
`ash
cp .env.example .env.local
`
Edit .env.local and fill in:
- DATABASE_URL — PostgreSQL connection string
- NEXTAUTH_SECRET — random 32+ char string (generate with openssl rand -base64 32)
- ESKIZ_EMAIL, ESKIZ_PASSWORD, ESKIZ_SENDER — your Eskiz.uz credentials
- WEBHOOK_SECRET — for social media lead webhooks
- NEXT_PUBLIC_BANK_CARD, NEXT_PUBLIC_BANK_NAME, NEXT_PUBLIC_BANK_HOLDER — payment info

### 3. Start PostgreSQL Database
`ash
docker-compose up -d
`
This starts PostgreSQL on port 5432 and pgAdmin on port 5050.

### 4. Run Database Migrations
`ash
npx prisma migrate dev --name init
`

### 5. Seed the Database
`ash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
`
This creates demo users, products, suppliers, and leads.

### 6. Start Development Server
`ash
npm run dev
`
Open [http://localhost:3000](http://localhost:3000)

---

## 👤 Default Login Credentials (after seeding)

| Role | Phone | Password |
|------|-------|----------|
| Admin | +998901234567 | admin123 |
| Employee | +998901234568 | employee123 |
| Courier | +998901234569 | courier123 |
| Customer | +998901234570 | customer123 |

---

## 📱 Application Panels

### 🔴 Admin Panel (/admin)
- **Dashboard**: Real-time stats — orders, revenue, debt, production
- **Production**: View all 6 manufacturing stages, track batches
- **CRM**: Kanban board for social media leads (New → Contacted → Ordered → Closed)
- **Orders**: Approve card payment receipts, manage order statuses
- **Inventory**: Raw materials (fabric rolls, padding, packaging), suppliers
- **Finance**: Cash vs Credit breakdown, debt management
- **SMS**: Broadcast debt reminders via Eskiz.uz

### 🟡 Employee Panel (/employee)
- Extremely simple UI designed for factory floor tablet use
- View assigned production batches
- One-tap stage advancement with confirmation

### 🟢 Courier Panel (/courier)
- View assigned deliveries with addresses
- Mark orders as delivered
- One-tap customer call button

### 🛍️ Market Panel (/market)
- Product catalog (B2C & B2B pricing)
- Add to cart, checkout
- Manual card transfer payment
- Upload payment receipt screenshot
- Track order status

---

## 🗄️ Database Schema

Key models:
- User (ADMIN | EMPLOYEE | COURIER | CUSTOMER)
- Supplier (LOCAL | INTERNATIONAL)
- RawMaterial + FabricRoll (inventory tracking)
- Product (with B2C + B2B pricing)
- ProductionBatch (6-stage state machine)
- StageLog (full audit trail)
- Lead (CRM with webhook ingestion)
- Order + OrderItem (with receipt upload flow)
- Delivery (courier assignment)
- Debt (credit/nasiya tracking)
- SmsLog (Eskiz.uz message history)

---

## 📡 Social Media Lead Webhook

To receive leads from Facebook/Instagram Lead Ads, configure the webhook URL in your Meta Business Manager:

`
POST https://your-domain.com/api/crm/webhook
Headers:
  X-Webhook-Secret: <your WEBHOOK_SECRET>
  X-Webhook-Source: FACEBOOK | INSTAGRAM | TIKTOK
`

Payload (Facebook Lead Ads format):
`json
{
  "field_data": [
    {"name": "full_name", "values": ["John Doe"]},
    {"name": "phone_number", "values": ["+998901234567"]}
  ]
}
`

---

## 📲 Eskiz.uz SMS Integration

- Automatically refreshes auth token (30-day expiry)
- Normalizes Uzbek phone numbers (998XXXXXXXXX format)
- Logs all messages in SmsLog table
- Bulk debt reminder broadcast from Admin → Finance panel
- Individual reminders from each DebtCard

---

## 🏗️ Production Build

`ash
npm run build
npm start
`

---

## 🛠️ Useful Commands

`ash
npm run dev          # Start dev server
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev only)
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset + re-migrate database
npm run build        # Production build
npm run lint         # Run ESLint
`

---

## 📁 Project Structure

`
tez-up-pro/
├── app/
│   ├── (auth)/login/        # Login page
│   ├── (admin)/admin/       # Admin dashboard & sub-pages
│   ├── (employee)/employee/ # Employee panel
│   ├── (courier)/courier/   # Courier panel
│   ├── (market)/market/     # Customer storefront
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # Base UI components
│   ├── layout/              # App shell (Header, Sidebar, MobileNav)
│   ├── admin/               # Admin-specific components
│   ├── crm/                 # CRM Kanban components
│   ├── production/          # Stage progress components
│   ├── courier/             # Courier delivery components
│   └── market/              # Storefront components
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── auth.ts              # NextAuth configuration
│   ├── eskiz.ts             # Eskiz.uz SMS API client
│   ├── production.ts        # Production state machine
│   ├── cartStore.ts         # Zustand cart store
│   └── utils.ts             # Shared utilities
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data
├── public/uploads/          # Receipt & product image uploads
├── docker-compose.yml       # PostgreSQL + pgAdmin
└── .env.example             # Environment template
`

---

## 🔐 Security Notes

- All role-protected routes enforced at middleware level
- Passwords hashed with bcrypt (12 rounds)
- File uploads validated: image/jpeg & image/png only, max 5MB
- Webhook endpoint validates shared secret header
- JWT tokens contain minimal user data (id, role)

---

*Built with ❤️ for Tez Up Pro — Textile ERP*
