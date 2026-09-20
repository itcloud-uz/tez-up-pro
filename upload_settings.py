import paramiko
import os

files = [
    ('lib/eskiz.ts', '/home/tezup/tez-up-pro/lib/eskiz.ts'),
    ('app/api/crm/leads/route.ts', '/home/tezup/tez-up-pro/app/api/crm/leads/route.ts'),
    ('app/api/crm/leads/[id]/route.ts', '/home/tezup/tez-up-pro/app/api/crm/leads/[id]/route.ts'),
    ('app/api/sms/send/route.ts', '/home/tezup/tez-up-pro/app/api/sms/send/route.ts'),
    ('app/api/admin/inventory/materials/route.ts', '/home/tezup/tez-up-pro/app/api/admin/inventory/materials/route.ts'),
    ('app/api/admin/inventory/materials/[id]/route.ts', '/home/tezup/tez-up-pro/app/api/admin/inventory/materials/[id]/route.ts'),
    ('app/api/admin/suppliers/route.ts', '/home/tezup/tez-up-pro/app/api/admin/suppliers/route.ts'),
    ('app/api/production/batches/route.ts', '/home/tezup/tez-up-pro/app/api/production/batches/route.ts'),
    ('app/(admin)/admin/sms/page.tsx', '/home/tezup/tez-up-pro/app/(admin)/admin/sms/page.tsx'),
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
