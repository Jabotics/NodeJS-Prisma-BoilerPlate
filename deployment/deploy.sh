npm install
echo "[+] npm installed\n\n"
echo ""
npx prisma migrate dev
echo "[+] Prisma migrated database and update schema"
echo ""
npm run build
echo "[+] Compilation complete"
echo ""
mkdir -p ./dist/CSV
echo "[+] local file directories created"
echo ""
cp ./swagger* ./dist/
npm run pre-deployment
echo "[+] Pre deployment measures were taken, like super admin, admin and dummy user generation"
echo ""
npm run deploy