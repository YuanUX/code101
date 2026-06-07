// Regenerates the JSON-LD structured data in public/index.html from the
// commandLibrary defined in the same file, so search engines can read the
// glossary without executing JavaScript.
//
// Run after adding, removing, or editing entries:
//   node scripts/update-jsonld.js

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'public', 'index.html');
let html = fs.readFileSync(FILE, 'utf8');

// Pull topics and commandLibrary straight out of the page script,
// so the structured data can never drift from what users see.
const topicsMatch = html.match(/const topics = \{[\s\S]*?\n        \};/);
const libMatch = html.match(/const commandLibrary = \[[\s\S]*?\n        \];/);
if (!topicsMatch || !libMatch) {
    console.error('Could not locate topics/commandLibrary in index.html');
    process.exit(1);
}
const topics = eval('(' + topicsMatch[0].replace('const topics =', '').replace(/;\s*$/, '') + ')');
const lib = eval(libMatch[0].replace('const commandLibrary =', '').replace(/;\s*$/, ''));

// Flatten topic categories into a categoryKey -> "Topic — Category" label map
const categories = {};
for (const topic of Object.values(topics)) {
    for (const [catKey, catTitle] of Object.entries(topic.categories)) {
        categories[catKey] = topic.title === catTitle ? catTitle : topic.title + ' — ' + catTitle;
    }
}

const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1]
    || 'A visual glossary of essential terminal commands for designers.';

const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            '@id': 'https://code101.work/#website',
            url: 'https://code101.work',
            name: 'code101',
            description,
            inLanguage: 'en'
        },
        {
            '@type': 'DefinedTermSet',
            '@id': 'https://code101.work/#commands',
            name: 'Terminal commands and front-end concepts for designers',
            description: 'Essential terminal, git, npm, HTML, CSS, and React terms explained in plain English for designers.',
            hasDefinedTerm: lib.map(c => ({
                '@type': 'DefinedTerm',
                name: c.cmd,
                alternateName: c.spelled,
                description: c.desc,
                inDefinedTermSet: 'https://code101.work/#commands',
                termCode: categories[c.category]
            }))
        }
    ]
};

const tag = '<script type="application/ld+json">\n' + JSON.stringify(jsonld) + '\n    </' + 'script>';
const blockRe = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
if (!blockRe.test(html)) {
    console.error('No existing JSON-LD block found in index.html');
    process.exit(1);
}
html = html.replace(blockRe, tag);
fs.writeFileSync(FILE, html);
console.log(`JSON-LD updated: ${lib.length} terms across ${Object.keys(categories).length} categories`);
