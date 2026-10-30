import { useState } from 'react';
import { programs } from './academicPrograms.js';
import AdmissionForm from './admissions/AdmissionForm.jsx';
import './public-site.css';
import { SAN_ANGELO_LOGO } from './brand.js';



const values = ['Ética profesional','Excelencia académica','Vocación de servicio','Disciplina','Liderazgo','Innovación','Humanismo','Responsabilidad social'];

export default function PublicSite() {
  const [menu, setMenu] = useState(false);
  const [admission, setAdmission] = useState(null);
  return <div className="public-site">
    <header className="public-nav" onKeyDown={e => { if (e.key === 'Escape') { setMenu(false); document.getElementById('public-menu-toggle')?.focus(); } }}>
      <a className="public-brand" href="#inicio" aria-label="Instituto de Ciencias Médicas San Ángelo">
        <img src={SAN_ANGELO_LOGO} alt="" />
        <span><b>San Ángelo</b><small>Instituto de Ciencias Médicas</small></span>
      </a>
      <button id="public-menu-toggle" className="public-menu-toggle" aria-expanded={menu} aria-controls="public-navigation" onClick={() => setMenu(v => !v)}>Menú</button>
      <nav id="public-navigation" className={menu ? 'is-open' : ''} aria-label="Navegación institucional" onClick={e => { if (e.target.closest('a')) setMenu(false); }}>
        <a href="#programas">Programas</a>
        <a href="#modelo">Modelo educativo</a>
        <a href="#filosofia">Filosofía</a>
        <a href="#campus">Campus</a>
      </nav>
    </header>

    <main className="public-main">
      <section className="public-hero" id="inicio">
        <div className="public-hero-copy">
          <p className="public-kicker">Ciencia · disciplina · humanidad</p>
          <h1>Formamos a quienes cuidarán el futuro de la salud.</h1>
          <p className="public-hero-lede">Una institución dedicada a la formación de médicos y líderes en salud, con excelencia académica, preparación clínica, innovación y profundo sentido humano.</p>
          <div className="public-actions">
            <a className="public-button primary" href="#programas">Conoce nuestra oferta académica</a>
            <a className="public-button ghost" href="#filosofia">Nuestra filosofía</a>
          </div>
          <div className="public-proof" aria-label="Pilares académicos">
            <span><strong>01</strong> Excelencia académica</span>
            <span><strong>02</strong> Liderazgo y disciplina</span>
            <span><strong>03</strong> Vocación de servicio</span>
          </div>
        </div>
        <div className="public-hero-art" aria-hidden="true">
          <div className="public-glow" />
          <img src={SAN_ANGELO_LOGO} alt="" />
          <span>ICMSA</span>
        </div>
      </section>

      <section className="public-intro" id="modelo">
        <div>
          <p className="public-kicker">Educación médica con propósito</p>
          <h2>Conocimiento riguroso. Decisiones responsables. Servicio a las personas.</h2>
        </div>
        <div className="public-intro-copy">
          <p>San Ángelo impulsa una formación integral basada en conocimiento científico, innovación, investigación y desarrollo de habilidades profesionales.</p>
          <p>El claustro académico integra médicos militares que aportan experiencia, disciplina, liderazgo, ética profesional y capacidad para tomar decisiones en entornos de alta exigencia.</p>
        </div>
      </section>

      <section className="public-programs" id="programas">
        <div className="public-section-heading">
          <div><p className="public-kicker">Oferta académica</p><h2>Tu siguiente etapa comienza aquí.</h2></div>
          <div><p>Programas orientados a la práctica, al pensamiento crítico y a una visión contemporánea de la medicina y la gestión de salud.</p><button type="button" className="program-admission-button" onClick={() => setAdmission('')}>Solicitud de admisión <span aria-hidden="true">↗</span></button></div>
        </div>
        <div className="program-grid">
          {programs.map(program => <article className="program-card" key={program.title}>
            <div className="program-top"><span>{program.mark}</span><small>{program.type}</small></div>
            <h3>{program.title}</h3>
            <p>{program.description}</p>
            <button type="button" className="program-admission-button" aria-label={'Solicitud de admisión · '+program.title} onClick={() => setAdmission(program.title)}>Solicitud de admisión<span className="sr-only"> · {program.title}</span><span aria-hidden="true"> ↗</span></button>
          </article>)}
        </div>
      </section>

      <section className="public-feature-band">
        <article>
          <span className="feature-number">A</span>
          <h3>Educación de excelencia</h3>
          <p>Preparación científica, clínica y humanista para ejercer con profesionalismo y compromiso social.</p>
        </article>
        <article>
          <span className="feature-number">B</span>
          <h3>Experiencia docente</h3>
          <p>Profesores con enfoque en disciplina, liderazgo, toma de decisiones y ética profesional.</p>
        </article>
        <article>
          <span className="feature-number">C</span>
          <h3>Desarrollo académico</h3>
          <p>Acercamiento a áreas innovadoras, incluida la medicina regenerativa, para ampliar la visión del futuro de la medicina.</p>
        </article>
      </section>

      <section className="public-philosophy" id="filosofia">
        <div className="philosophy-statement">
          <p className="public-kicker">Filosofía institucional</p>
          <blockquote>“Excelencia académica con sentido humano y compromiso social.”</blockquote>
          <p>La educación transforma vidas. Nuestro propósito es formar profesionales capaces de enfrentar los retos actuales y futuros del sector salud con conocimiento, sensibilidad y vocación.</p>
        </div>
        <div className="mission-grid">
          <article><span>Misión</span><h3>Preparar profesionales altamente capacitados.</h3><p>Con sólida formación científica, ética y humana, comprometidos con el bienestar de la sociedad.</p></article>
          <article><span>Visión</span><h3>Ser referentes en educación médica.</h3><p>Por la excelencia académica, la innovación, el liderazgo y la capacidad de transformar positivamente la atención médica.</p></article>
        </div>
      </section>

      <section className="public-values">
        <p className="public-kicker">Nuestros valores</p>
        <div className="values-row">{values.map((value,index)=><span key={value}><b>{String(index+1).padStart(2,'0')}</b>{value}</span>)}</div>
      </section>

      <section className="public-campus" id="campus">
        <div>
          <p className="public-kicker">Campus San Ángelo</p>
          <h2>Un espacio para aprender medicina con exigencia, tecnología y propósito.</h2>
          <p>Instituto de Ciencias Médicas San Ángelo · Coacalco de Berriozábal, Estado de México.</p>
        </div>
        <div className="public-campus-card">
          <span>Instituto San Ángelo</span>
          <strong>Educación que impulsa tu futuro.</strong>
          <span className="campus-note">Información institucional disponible en esta plataforma.</span>
        </div>
      </section>

      <section className="public-final-cta">
        <img src={SAN_ANGELO_LOGO} alt="" />
        <div><p className="public-kicker">Instituto de Ciencias Médicas San Ángelo</p><h2>La medicina necesita conocimiento. También carácter.</h2></div>
        <a className="public-button light" href="#programas">Explorar programas</a>
      </section>
    </main>

    {admission!==null&&<AdmissionForm initialProgram={admission} onClose={()=>setAdmission(null)}/>}
    <footer className="public-footer">
      <div className="public-brand footer-brand"><span><b>San Ángelo</b><small>Instituto de Ciencias Médicas</small></span></div>
      <p>Licenciaturas · Maestrías · Educación médica</p>
      <div><span>Instituto de Ciencias Médicas San Ángelo</span></div>
    </footer>
  </div>;
}

