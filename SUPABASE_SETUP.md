# Atlas Trading - Supabase Standalone Setup

هذا المشروع الآن مستقل تماماً ويعتمد على **GitHub** و **Supabase** فقط.

## المتطلبات

- Node.js 18+
- npm أو pnpm
- حساب Supabase (مجاني)

## التثبيت والتشغيل

### 1. استنساخ المستودع

```bash
git clone https://github.com/rami-root/atlas-trading-clean.git
cd atlas-trading-clean
```

### 2. تثبيت الاعتمادات

```bash
npm install
# أو
pnpm install
```

### 3. إعداد متغيرات البيئة

قم بإنشاء ملف `.env.local` في جذر المشروع:

```env
VITE_SUPABASE_URL=https://ayruvllbgxcossejudwt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_q9fMTO7hFx4bEH0zsQVkRA_K_qH7MzW
```

### 4. تشغيل الموقع محلياً

```bash
npm run dev
# أو
pnpm dev
```

الموقع سيكون متاحاً على `http://localhost:5173`

### 5. بناء للإنتاج

```bash
npm run build
# أو
pnpm build
```

سيتم إنشاء ملفات الإنتاج في مجلد `dist/client`

## البنية المعمارية

- **الواجهة الأمامية (Frontend):** React + Vite + Supabase SDK
- **قاعدة البيانات:** Supabase (PostgreSQL)
- **المصادقة:** Supabase Auth
- **التخزين:** Supabase Storage

## الميزات

✅ مستقل تماماً (لا يحتاج لسيرفر خارجي)
✅ متصل بـ Supabase للبيانات والمصادقة
✅ أسعار العملات الحقيقية من CoinGecko
✅ نظام تسجيل دخول وتسجيل
✅ محفظة وإدارة رأس المال
✅ نظام التداول

## نشر الموقع

### خيار 1: Netlify (الأسهل)

1. ادفع الكود إلى GitHub
2. اذهب إلى [netlify.com](https://netlify.com)
3. اختر "New site from Git"
4. اختر المستودع
5. اترك الإعدادات الافتراضية واضغط Deploy

### خيار 2: GitHub Pages

```bash
npm run build
```

ثم ادفع مجلد `dist/client` إلى فرع `gh-pages`

### خيار 3: Supabase Hosting (قريباً)

Supabase توفر استضافة مباشرة للمشاريع الثابتة.

## الدعم

للمزيد من المعلومات:
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
