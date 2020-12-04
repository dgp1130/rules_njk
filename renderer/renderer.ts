import * as nunjucks from 'nunjucks';

console.log(nunjucks.renderString('Hello, {{ name }}!', {
    name: 'World',
}));
