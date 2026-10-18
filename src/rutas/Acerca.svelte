<script lang="ts">
  // Qué es el proyecto y de dónde sale cada dato. Las atribuciones completas viven en DATA_SOURCES.md.
</script>

<article>
  <h1>Acerca de Proyecto Maranata</h1>
  <p>
    Proyecto Maranata es un sitio gratuito y sin fines de lucro para explorar la Biblia en español a
    través de sus referencias cruzadas: más de 340.000 conexiones entre versículos, de Génesis a
    Apocalipsis. No tiene publicidad, suscripciones ni funciones pagas.
  </p>
  <p>
    El código es abierto (licencia MIT) y está en
    <a href="https://github.com/MarioPC2025/ProyectoMaranata">GitHub</a>. Lo hace Mario Baldovino.
  </p>

  <h2>Fuentes</h2>

  <h3>Referencias cruzadas</h3>
  <p>
    <a href="https://www.openbible.info/labs/cross-references/">OpenBible.info Cross References</a>,
    bajo licencia
    <a href="https://creativecommons.org/licenses/by/4.0/deed.es">Creative Commons Atribución</a>.
    Se basan principalmente en el <cite>Treasury of Scripture Knowledge</cite> (dominio público), con
    la puntuación de la comunidad de OpenBible.info. Para este sitio se convirtieron a un formato binario
    compacto y las referencias a 3 Juan 1:15 se asignaron a 3 Juan 1:14.
  </p>

  <h3>Hebreo y griego</h3>
  <p>
    Texto hebreo y griego, transliteración, morfología, glosas y números Strong de
    <a href="https://github.com/STEPBible/STEPBible-Data">STEPBible-Data</a> (Tyndale House,
    Cambridge), bajo licencia
    <a href="https://creativecommons.org/licenses/by/4.0/deed.es">CC BY 4.0</a>: crédito a
    <a href="https://www.stepbible.org">STEP Bible</a>. Las descripciones de la morfología se
    tradujeron al español para este sitio. Tipografías Noto Serif y Noto Serif Hebrew (licencia SIL
    Open Font).
  </p>

  <h3>Texto bíblico</h3>
  <ul>
    <li>
      <strong>Reina-Valera 1909</strong>: dominio público. Archivo de
      <a href="https://ebible.org/Scriptures/details.php?id=spaRV1909">eBible.org</a>. En algunos
      capítulos su numeración difiere de la que usan las referencias; el sitio lo avisa.
    </li>
    <li>
      <strong>Nueva Traducción Viviente (NTV)</strong>: © 2010 Tyndale House Foundation. Se muestra
      a través de <a href="https://api.bible">API.Bible</a> (American Bible Society) para uso no comercial,
      con su copyright junto al texto.
    </li>
    <li>
      <strong>Nueva Versión Internacional (NVI-S)</strong> y
      <strong>Reina-Valera Antigua (RVES)</strong>: a través de
      <a href="https://platform.youversion.com">YouVersion Platform</a>, con la atribución de cada
      versión junto al texto.
    </li>
  </ul>
  <p>
    El texto de las versiones con derechos de autor se muestra tal como lo entregan sus proveedores,
    sin cambios, y no se guarda en el código del sitio. Otras versiones (RVR1960, TLA) se ofrecen
    como enlace a Bible Gateway.
  </p>

  <h2>Privacidad</h2>
  <p>
    El sitio no tiene cuentas ni analíticas propias. Tu preferencia de tema y la versión paralela
    elegida se guardan solo en tu navegador. Cuando mostrás la NTV, la NVI-S o la RVES, tu navegador
    se conecta con los servidores de esos proveedores; en el caso de la NTV, API.Bible registra la
    vista de forma anónima (su sistema FUMS), como exige su licencia.
  </p>
</article>

<style>
  article {
    line-height: 1.65;
  }
  h1 {
    font-family: var(--fuente-lectura);
  }
  h2 {
    margin-top: 2rem;
  }
  h3 {
    margin: 1.25rem 0 0.25rem;
    font-size: 1rem;
  }
  li {
    margin-bottom: 0.5rem;
  }
</style>
