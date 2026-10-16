# ربط Cloudflare Pages مع Google Sites مرة واحدة

1. دخل https://dash.cloudflare.com/ وسجّل دخولك.
2. من Workers & Pages اختار Create application ثم Pages ثم Connect to Git.
3. اربط GitHub واختار khaliyoussef5/assassat-khali-app.
4. Production branch: main؛ Framework preset: None؛ Build command: npm test؛ Output directory: public؛ Root directory: /.
5. راقب نجاح النشر، وخذ رابط https://اسم-المشروع.pages.dev اللي غادي يعطيك Cloudflare.
6. من Google Sites: Insert → Embed → By URL؛ ألصق الرابط واحفظ وانشر.
7. من بعد: تعديل الكود فـGitHub غادي ينشر أوتوماتيكياً، وبلا تغيير رابط Google Sites.

مهم: راجع المعاينة قبل النشر، وما ترسل حتى كلمة مرور أو API Token.
