const puppeteer = require('puppeteer');
const fs = require('fs');
const { MongoClient } = require('mongodb');

// Remplacez ces valeurs par celles obtenues sur MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://borjali:DJjdkic2lP7cp7S5@cluster0.2abef3a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB_NAME = 'lego';

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

    // Connexion à MongoDB
    const client = await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(MONGODB_DB_NAME);

    // Insérer les données récupérées dans MongoDB
    const collection = db.collection('deals');
    const result = await collection.insertMany(deals);

    console.log(`${deals.length} deals trouvés et enregistrés dans MongoDB`);
    console.log('Resultat d\'insertion:', result);

    // Sauvegarder les données dans un fichier JSON
    fs.writeFileSync('lego_deals.json', JSON.stringify(deals, null, 2));
    console.log(`${deals.length} deals trouvés et enregistrés dans lego_deals.json`);

        // Trouver les meilleures offres avec la meilleure réduction
    const bestDiscountDeals = await collection.find().sort({ discount: -1 }).limit(10).toArray();
    console.log('Meilleures offres avec réduction :', bestDiscountDeals);

    // Trouver les offres les plus commentées (supposé que le champ "comments" existe)
    const mostCommentedDeals = await collection.find().sort({ comments: -1 }).limit(10).toArray();
    console.log('Offres les plus commentées :', mostCommentedDeals);

    // Trouver les offres triées par prix
    const sortedByPriceDeals = await collection.find().sort({ price: 1 }).toArray();
    console.log('Offres triées par prix :', sortedByPriceDeals);

    // Trouver les offres triées par date
    const sortedByDateDeals = await collection.find().sort({ date: -1 }).toArray();
    console.log('Offres triées par date :', sortedByDateDeals);

    // Fermer la connexion MongoDB
    await client.close();

    return deals;
}

module.exports.scrape = scrape;
