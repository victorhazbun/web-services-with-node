import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import * as templates from './templates';

// Page setup.
document.body.innerHTML = templates.main();
const mainElement = document.body.querySelector('.b4-main');
const alertsElement = document.body.querySelector('.b4-alerts');

const getBundles = async () => {
  const elasticsearchRes = await fetch('/elasticsearch/b4/bundle/_search?size=1000');

  const elasticsearchResBody = await elasticsearchRes.json();

  return elasticsearchResBody.hits.hits.map(hit => ({
    id: hit._id,
    name: hit._source.name,
  }));
};

const listBundles = bundles => {
  mainElement.innerHTML = templates.listBundles({bundles});
};

const showView = async () => {
  const [view, ...params] = window.location.hash.split('/');

  switch (view) {
    case '#welcome':
      mainElement.innerHTML = templates.welcome();
      break;
    case '#list-bundles':
      const bundles = await getBundles();
      listBundles(bundles);
      break;
    default:
      // Unrecognized view.
      throw Error(`Unrecognized view: ${view}`);
  }
};

window.addEventListener('hashchange', showView);

showView().catch(err => window.location.hash = '#welcome');
