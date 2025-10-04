
Vinylregister – Auto-Apply Kit v2
=================================

Det här kitet innehåller en körbar "index.html" som laddar auto_apply_v2.js.
Du kan öppna index.html direkt i din webbläsare, se toppmeny, manuella fält-stil,
dolt EAN i registret, och klicka dig vidare till rapport.html.

Innehåll
--------
index.html
css/patch_v1.css
js/auto_apply_v2.js
js/rapport.js
rapport.html
img/placeholder-vinyl.png

Snabbstart
----------
1) Öppna index.html i din webbläsare.
2) Se att toppmeny läggs in automatiskt (Register / Rapport).
3) "Försäljningspris" får diskret bakgrund (manuellt fält).
4) "Inköpsdatum" läggs in automatiskt i metadata-delen.
5) EAN-kolumnen i tabellen döljs.
6) Gå till index.html?demo=1 och klicka sedan "Rapport" i toppmenyn.

Integrera i ditt projekt
------------------------
- Kopiera över js/auto_apply_v2.js till ditt projekt och lägg till:
    <script src="js/auto_apply_v2.js"></script>
  i din huvudsida (index.html eller motsvarande).

- Vill du även ha stilarna för meny och manuella fält?
  Kopiera över css/patch_v1.css och länka in den:
    <link rel="stylesheet" href="css/patch_v1.css">

- Om du vill använda rapportsidan rakt av, lägg in rapport.html och js/rapport.js.
  Rapportsidan läser från localStorage-nyckeln 'vinyl_records'.

Lycka till!
