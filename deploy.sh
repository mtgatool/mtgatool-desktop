git pull
npm install
npm run build
chmod 644 -R build
/bin/rm -r ../html/fonts/*
/bin/rm -r ../html/images/*
/bin/rm -r ../html/js/*
/bin/cp -r build/* ../html