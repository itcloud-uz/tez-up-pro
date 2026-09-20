import paramiko
import os

files = [
    ('app/api/admin/finance/customer-statement/route.ts', '/home/tezup/tez-up-pro/app/api/admin/finance/customer-statement/route.ts'),
    ('lib/pdfGenerator.ts', '/home/tezup/tez-up-pro/lib/pdfGenerator.ts'),
    ('app/(admin)/admin/finance/page.tsx', '/home/tezup/tez-up-pro/app/(admin)/admin/finance/page.tsx'),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('100.110.111.111', username='tezup', password='clone2026')

for local, remote in files:
    remote_dir = os.path.dirname(remote).replace('\\', '/')
    stdin, stdout, stderr = ssh.exec_command(f'mkdir -p "{remote_dir}"')
    stdout.channel.recv_exit_status()

sftp = ssh.open_sftp()
for local, remote in files:
    print(f'Uploading {local} -> {remote}')
    sftp.put(local, remote)

sftp.close()
ssh.close()
print('All files uploaded successfully!')
