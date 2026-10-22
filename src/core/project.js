const overrides = import.meta.glob('../domain/site.js', { eager: true, import: 'default' });
export const project = overrides['../domain/site.js'] || Object.freeze({
  id: 'web-model', name: 'WEB MODEL V1', eyebrow: 'Base de aplicación',
  headline: 'Un punto de partida claro.',
  description: 'Accede a tu espacio de trabajo desde una interfaz sencilla y accesible.',
  accent: '#222222', pages: [], services: [],
});
