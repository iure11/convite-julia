# Receber as respostas no Google Sheets

1. Crie uma planilha no Google Sheets.
2. Nela, abra **Extensões → Apps Script**.
3. Apague o conteúdo inicial de `Code.gs` e cole o conteúdo deste projeto.
4. Salve o projeto.
5. No editor, execute uma função uma vez e autorize o acesso solicitado. Se preferir, crie temporariamente `function autorizar() { SpreadsheetApp.getActiveSpreadsheet().getName(); }`, execute-a e depois apague-a.
6. Clique em **Implantar → Nova implantação**.
7. Escolha **Aplicativo da Web**.
8. Em “Executar como”, escolha sua conta. Em acesso, escolha **Qualquer pessoa**.
9. Implante e copie a URL que termina em `/exec`.
10. Cole essa URL em `CONFIG.googleScriptUrl`, no arquivo `config.js`.
11. Publique o site novamente e faça um envio de teste.
12. Confirme a nova linha na aba **Respostas**.

Se o código do Apps Script for alterado depois, normalmente é preciso criar uma nova versão da implantação. Não use a URL de teste terminada em `/dev`.

O script evita duplicidade pelo ID da resposta e usa bloqueio durante a gravação. Não coloque senhas, chaves ou credenciais no site.
