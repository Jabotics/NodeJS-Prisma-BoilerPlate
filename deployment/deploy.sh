npm install
echo "[+] npm installed\n\n"
echo ""
npx prisma migrate dev
echo "[+] Prisma migrated database and update schema"
echo ""
npm run build
echo "[+] Compilation complete"
echo ""
mkdir -p ./dist/uploads/360Close
mkdir -p ./dist/uploads/360Open
mkdir -p ./dist/uploads/General
mkdir -p ./dist/uploads/Inspection
mkdir -p ./dist/uploads/Others
mkdir -p ./dist/uploads/Wheels
mkdir -p ./dist/CSV
echo "[+] local file directories created"
echo ""
cp ./swagger* ./dist/
npm run pre-deployment
echo "[+] Pre deployment measures were taken, like super admin, admin and dummy user generation"
echo ""
npm run deploy