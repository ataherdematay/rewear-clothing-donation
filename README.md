# ReWear – Clothing Donation Website

Okul sosyal sorumluluk projesi için hazırlanmış, tamamen frontend çalışan bir prototip.
Veritabanı yok: tüm veriler tarayıcının `localStorage`'ında tutulur ve sahte (demo) verilerdir.

## Açmak

```bash
python3 -m http.server 5173
```

Sonra tarayıcıda `http://localhost:5173` adresini aç. (`index.html` dosyasına çift tıklayarak da açılır.)

## Sayfalar

| Sayfa | Ne yapar |
| --- | --- |
| `index.html` | Ana sayfa: nasıl çalışır, canlı etiket takibi (RW-xxxx), istatistikler, outlet, kampanyalar, problem/çözüm, benzer projeler araştırması, SSS, para bağışı |
| `shop.html` | The Rack: kıyafetleri beden/mevsim/cinsiyet/duruma göre filtrele; outlet'ten rezerve et, aileler ücretsiz talep eder, "ihtiyaç bildir" |
| `donate.html` | 4 adımlı kıyafet bağışı sihirbazı (her parça için etiket kodu üretir) + para bağışı |
| `login.html` | Giriş / kayıt (bağışçı veya aile), demo hesap butonları |
| `account.html` | Bağışçı: etiketlerim ve bağışlarım. Aile: taleplerim |
| `admin.html` | Admin paneli: genel bakış, ayırma kuyruğu, talepler ve eşleştirme, envanter, outlet siparişleri, kampanyalar, para, kullanıcı doğrulama |

## Demo hesaplar

| Rol | E-posta | Şifre |
| --- | --- | --- |
| Admin | admin@rewear.org | admin123 |
| Bağışçı | donor@rewear.org | donor123 |
| Aile | family@rewear.org | family123 |

Admin panelindeki **Reset demo data** butonu her şeyi başlangıç verisine döndürür.

## Fotoğraflar

Wikimedia Commons'tan, açık lisanslı (CC BY / CC BY-SA / CC0). Kaynaklar `assets/credits.json` içinde ve sitenin alt kısmında yazılı.
Kıyafet çizimleri kodla (SVG) çizildi.

`assets/img/` ve `assets/video/` içindeki fotoğraflar, kesilmiş kıyafet görselleri ve video döngüleri fal.ai ile üretilmiş yapay zekâ görselleridir; gerçek ReWear kişileri veya mekânları değildir. Ayrıntılar `assets/MEDIA.md` içinde.
