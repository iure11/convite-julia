# Um convite extremamente sério para Júlia

Convite interativo, engraçado e discretamente romântico feito em HTML, CSS e JavaScript puro. Ele funciona diretamente no GitHub Pages, guarda escolhas temporariamente no navegador, registra a resposta no Google Sheets, cria um evento de calendário e oferece uma mensagem pelo WhatsApp.

## Estrutura

```text
convite-julia/
├── index.html
├── styles.css
├── script.js
├── config.js
├── 404.html
├── robots.txt
├── site.webmanifest
├── favicon.svg
├── .nojekyll
├── README.md
├── assets/
│   ├── gatinho-romantico.webp
│   ├── gatinho-coracoes.webp
│   ├── julia-placeholder.svg
│   └── social-preview.webp
└── google-apps-script/
    ├── Code.gs
    └── README.md
```

## Executar localmente

Na pasta do projeto, execute `python -m http.server 8000` e abra `http://localhost:8000`. Abrir o HTML com clique duplo também exibe a interface, mas um servidor local representa melhor a publicação.

## Personalizar

- **Nomes, identificador, WhatsApp e planilha:** edite `config.js`.
- **Textos e três opções:** edite `index.html`; mantenha os valores internos aceitos também em `google-apps-script/Code.gs`.
- **Data principal:** altere `MAIN_DATE` em `script.js` e o texto correspondente em `index.html`.
- **Horários:** edite os botões `data-time` em `index.html`; a validação começa às 18h em `script.js`.
- **Foto da Júlia:** coloque uma imagem WebP quadrada (proporção 1:1) em `assets/julia.webp`. Sem esse arquivo, o placeholder aparece automaticamente.
- **Meme:** substitua `assets/gatinho-romantico.webp` mantendo o nome.

## Configurar o WhatsApp

No `config.js`, troque `COLOCAR_NUMERO_AQUI` por um número no formato internacional, somente com dígitos, por exemplo `5534999999999`. Se ficar sem configuração, o botão será ocultado.

## Configurar o Google Sheets

1. Crie uma planilha.
2. Abra **Extensões → Apps Script**.
3. Copie `google-apps-script/Code.gs` para o editor e salve.
4. Execute e autorize o script uma vez.
5. Clique em **Implantar → Nova implantação → Aplicativo da Web**.
6. Configure para executar como o proprietário e permitir acesso a qualquer pessoa.
7. Copie a URL terminada em `/exec`.
8. Cole a URL em `CONFIG.googleScriptUrl`, em `config.js`.
9. Publique o site novamente, envie uma resposta de teste e confira a aba **Respostas**.

Alterações futuras no Apps Script podem exigir uma nova versão da implantação. A planilha receberá data de recebimento, ID, convite, nomes, reação, rolê, data, horário, preferências, observação e URL da página.

## Publicar no GitHub Pages

```bash
git init
git add .
git commit -m "feat: build interactive invitation"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/convite-julia.git
git push -u origin main
```

No GitHub, abra **Settings → Pages**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. O endereço terá o formato `https://SEU_USUARIO.github.io/convite-julia/`.

Para atualizar, altere os arquivos e execute `git add .`, `git commit -m "descrição da alteração"` e `git push`.

## Privacidade

O projeto solicita aos buscadores que não indexem as páginas, mas isso não torna o site privado. Em um repositório público e no GitHub Pages, qualquer pessoa com o link pode acessar os arquivos — inclusive a foto em `assets/julia.webp`. Não publique sobrenome, telefone visível, localização ou outros dados pessoais desnecessários. Não há analytics nem publicidade.

## Solução de problemas

- **A foto não apareceu:** confira o nome exato `assets/julia.webp`; o placeholder continuará funcionando.
- **A planilha não recebeu a resposta:** confirme que a URL termina em `/exec`, que a implantação permite acesso e que você republicou o site após editar `config.js`.
- **O botão do WhatsApp não apareceu:** use somente números no formato internacional.
- **A página perdeu as escolhas:** o armazenamento do navegador pode estar bloqueado ou ter sido apagado.
- **O GitHub Pages está sem estilo:** confirme que todos os caminhos continuam relativos e que os arquivos foram enviados mantendo as pastas.
