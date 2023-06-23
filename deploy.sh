#!/bin/bash

#git
git add *
git commit -am 'update'
git push

#desplega al servidor
# -h  human readable format
# -P  mostra progrés
# -vv incrementa verbositat
# -r  actua recursivament
rsync -hPvr \
  --exclude "node_modules" \
  --exclude ".git" \
  --exclude "log.txt" \
  --exclude "package-lock.json" \
  . root@icra.loading.net:/var/www/vhosts/icradev.cat/ecostp2023.icradev.cat
