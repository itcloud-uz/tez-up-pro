import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('100.110.111.111', username='tezup', password='clone2026')

commands = [
    'cd /home/tezup/tez-up-pro && npx prisma db push',
    'cd /home/tezup/tez-up-pro && npm run build',
    'pm2 restart tezuppro'
]

for cmd in commands:
    print(f'Executing: {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(f'STDOUT: {out.encode("ascii", errors="replace").decode()}')
    if err:
        print(f'STDERR: {err.encode("ascii", errors="replace").decode()}')

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/settings')
code = stdout.read().decode().strip()
print(f'HTTP Check /admin/settings: {code}')

stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/crm')
code = stdout.read().decode().strip()
print(f'HTTP Check /admin/crm: {code}')

ssh.close()
