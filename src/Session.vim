let SessionLoad = 1
let s:so_save = &so | let s:siso_save = &siso | set so=0 siso=0
let v:this_session=expand("<sfile>:p")
silent only
cd ~/projects/libreformbuilder/src
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
set shortmess=aoO
badd +1 store.js
badd +14 index.js
badd +6 containers/App.js
badd +6 logic/app-logic.js
badd +1 utils/req.js
badd +2 components/builder/Builder.js
badd +134 components/workarea/WorkArea.js
badd +3 components/button/Button.js
badd +1 components/button/Button.scss
badd +18 components/HTML/HTML.js
badd +84 components/preview/Preview.js
badd +1 components/preview/Preview.scss
badd +1 components/builder/Builder.scss
badd +30 ~/projects/libreformbuilder/public/index.html
badd +1 index.css
badd +2 scss/animations.scss
badd +1 scss/component.scss
argglobal
silent! argdel *
edit scss/animations.scss
set splitbelow splitright
wincmd t
set winminheight=1 winminwidth=1 winheight=1 winwidth=1
argglobal
setlocal fdm=syntax
setlocal fde=0
setlocal fmr={{{,}}}
setlocal fdi=#
setlocal fdl=20
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 2 - ((1 * winheight(0) + 37) / 75)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
2
normal! 03|
lcd ~/projects/libreformbuilder/src/scss
tabnext 1
if exists('s:wipebuf') && getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20 winminheight=1 winminwidth=1 shortmess=filnxtToO
let s:sx = expand("<sfile>:p:r")."x.vim"
if file_readable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &so = s:so_save | let &siso = s:siso_save
let g:this_session = v:this_session
let g:this_obsession = v:this_session
let g:this_obsession_status = 2
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
