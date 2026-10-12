import next from '@next/eslint-plugin-next'
export default [{ignores:['.next/**','node_modules/**','public/**','backend/**']},{plugins:{'@next/next':next},rules:{'@next/next/no-html-link-for-pages':'off'}}]
