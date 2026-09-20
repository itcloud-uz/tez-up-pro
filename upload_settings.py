import paramiko
import os

files = [
    ('prisma/schema.prisma', '/home/tezup/tez-up-pro/prisma/schema.prisma'),
    ('components/layout/AppLayout.tsx', '/home/tezup/tez-up-pro/components/layout/AppLayout.tsx'),
    ('app/(admin)/admin/settings/page.tsx', '/home/tezup/tez-up-pro/app/(admin)/admin/settings/page.tsx'),
    ('app/(admin)/admin/crm/page.tsx', '/home/tezup/tez-up-pro/app/(admin)/admin/crm/page.tsx'),
    ('app/api/admin/settings/route.ts', '/home/tezup/tez-up-pro/app/api/admin/settings/route.ts'),
    ('app/api/admin/settings/test-eskiz/route.ts', '/home/tezup/tez-up-pro/app/api/admin/settings/test-eskiz/route.ts'),
    ('app/api/crm/webhook/route.ts', '/home/tezup/tez-up-pro/app/api/crm/webhook/route.ts')
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
