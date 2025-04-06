const puppeteer = require('puppeteer');
const fs = require('fs');


async function scrape(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Simule un vrai navigateur pour éviter les blocages
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36');


    console.log('⏳ Chargement de la page...');
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 🔄 Attendre que les deals soient chargés
    await page.waitForSelector('article.thread', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Aucun deal trouvé après 10 secondes !');
    });

    console.log('🔍 Extraction des deals...');
    const deals = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article.thread')).map(deal => ({
            title: deal.querySelector('.thread-title a')?.innerText.trim(),
            price: deal.querySelector('.text--b.size--all-xl')?.innerText.trim(),
            discount: deal.querySelector('.textBadge')?.innerText.trim() || 'No discount',
            link: deal.querySelector('.thread-title a')?.href,
            temperature: deal.querySelector('.vote-temp')?.innerText.trim(),
            image: deal.querySelector('.thread-image')?.src
        })).filter(deal => deal.title); // Supprime les résultats vides
    });

    await browser.close();

    // Sauvegarder les données dans un fichier JSON
    fs.writeFileSync('lego_deals.json', JSON.stringify(deals, null, 2));
    console.log(`${deals.length} deals trouvés et enregistrés dans lego_deals.json`);


    return deals;
}

module.exports.scrape = scrape;
