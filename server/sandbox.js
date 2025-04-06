const dealabs = require('./websites/dealabs');  // Chemin correct vers dealabs.js

async function sandbox(website) {
    try {
        console.log(`Browsing ${website} website...`);

        let deals;

        if (website.includes('dealabs')) {
            deals = await dealabs.scrape(website);
        } else {
            throw new Error('Site non pris en charge.');
        }
        console.log(deals);
        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.error('Erreur:', e);
        process.exit(1);
    }
}

const [, , eshop] = process.argv;

sandbox(eshop || 'https://www.dealabs.com/groupe/lego');
