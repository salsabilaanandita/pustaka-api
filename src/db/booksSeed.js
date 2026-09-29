// Seed data: 10 categories x 10 books = 100 books.
// Row format: [title, author, pages (approx), price (IDR), stock, synopsis]
// Import into src/data/api.js and use as the initial db.

export const categories = [
  { id: "c01", name: "Literature", slug: "literature" },
  { id: "c02", name: "History", slug: "history" },
  { id: "c03", name: "Sci-Fi & Fantasy", slug: "scifi-fantasy" },
  { id: "c04", name: "Philosophy", slug: "philosophy" },
  { id: "c05", name: "Business & Tech", slug: "business-tech" },
  { id: "c06", name: "Self Development", slug: "self-dev" },
  { id: "c07", name: "Romance", slug: "romance" },
  { id: "c08", name: "Young Adult", slug: "young-adult" },
  { id: "c09", name: "Religion & Spirituality", slug: "religion" },
  { id: "c10", name: "Mystery & Horror", slug: "mystery-horror" },
];

const raw = {
  literature: [
    ["Bumi Manusia", "Pramoedya Ananta Toer", 535, 125000, 18, "Minke, a native student in colonial Java, falls in love with Annelies and confronts the injustice of Dutch rule."],
    ["Laskar Pelangi", "Andrea Hirata", 529, 105000, 32, "Ten students at a struggling village school on Belitung hold on to their dreams despite poverty."],
    ["Cantik Itu Luka", "Eka Kurniawan", 520, 120000, 9, "A woman rises from her grave and the cursed fate of her four daughters unfolds across a century of Indonesian history."],
    ["Laut Bercerita", "Leila S. Chudori", 379, 110000, 21, "A student activist disappears in 1998, and the family he left behind keeps searching for answers."],
    ["Pulang", "Leila S. Chudori", 461, 105000, 14, "Indonesian exiles in Paris after 1965 and the next generation's search for a place to call home."],
    ["Ronggeng Dukuh Paruk", "Ahmad Tohari", 408, 95000, 11, "A village dancer's life is upended by the political turmoil of the mid-1960s."],
    ["Saman", "Ayu Utami", 197, 85000, 7, "A former priest turned activist and four women friends navigate faith, desire, and repression."],
    ["Negeri 5 Menara", "A. Fuadi", 423, 95000, 26, "Six boys at an East Java boarding school chase big dreams with hard work and friendship."],
    ["Perahu Kertas", "Dee Lestari", 444, 100000, 19, "Kugy and Keenan drift between art, love, and the lives others expect them to lead."],
    ["Tenggelamnya Kapal Van der Wijck", "Hamka", 224, 70000, 13, "Zainuddin and Hayati's love is broken by custom and class in Minangkabau society."],
  ],
  history: [
    ["Anak Semua Bangsa", "Pramoedya Ananta Toer", 538, 125000, 15, "The second Buru Quartet novel: Minke looks beyond his own circle and begins writing for his people."],
    ["Jejak Langkah", "Pramoedya Ananta Toer", 724, 135000, 10, "Minke founds an organization and a newspaper as the early nationalist movement takes shape."],
    ["Rumah Kaca", "Pramoedya Ananta Toer", 646, 130000, 8, "The Buru Quartet's finale, told by a colonial official who watches Minke's movement from the outside."],
    ["Arok Dedes", "Pramoedya Ananta Toer", 570, 115000, 12, "A retelling of Ken Arok's rise to power and the founding of the Singhasari dynasty."],
    ["Gadis Pantai", "Pramoedya Ananta Toer", 272, 90000, 16, "A fisherman's daughter is married to a Javanese aristocrat and learns the cost of class."],
    ["Burung-Burung Manyar", "Y.B. Mangunwijaya", 288, 95000, 6, "Teto chases his own destiny through the war years and the birth of independent Indonesia."],
    ["Amba", "Laksmi Pamuntjak", 496, 110000, 9, "Amba searches for her lost lover across the shadow of 1965 and the prison island of Buru."],
    ["Ca Bau Kan", "Remy Sylado", 420, 100000, 4, "A Chinese-Indonesian family saga of love and trade from the colonial era into independence."],
    ["Jalan Raya Pos, Jalan Daendels", "Pramoedya Ananta Toer", 148, 80000, 22, "A reflection on the Great Post Road built under Daendels and the forced labor behind it."],
    ["Nyanyi Sunyi Seorang Bisu", "Pramoedya Ananta Toer", 340, 105000, 12, "Notes and memoirs from Pramoedya's years as a political prisoner on Buru Island."],
  ],
  "scifi-fantasy": [
    ["Supernova: Ksatria, Puteri, dan Bintang Jatuh", "Dee Lestari", 288, 95000, 24, "Two men write a love story that blends science and myth, and it begins to pull a real woman in."],
    ["Supernova: Akar", "Dee Lestari", 270, 90000, 17, "Bodhi, a wanderer marked by a strange tattoo, searches for the roots of who he is."],
    ["Supernova: Petir", "Dee Lestari", 240, 90000, 15, "Elektra, a young woman who conducts electricity, is drawn into the Supernova puzzle."],
    ["Aroma Karsa", "Dee Lestari", 710, 130000, 20, "Jati Wesi, gifted with an extraordinary sense of smell, hunts a legendary plant tied to his family."],
    ["Bumi", "Tere Liye", 440, 95000, 30, "Raib discovers she can vanish, and meets two friends with abilities from a hidden parallel world."],
    ["Bulan", "Tere Liye", 400, 95000, 25, "The three friends slip deeper into the parallel world and meet the Bulan clan."],
    ["Matahari", "Tere Liye", 400, 95000, 22, "The trio's journey continues into the Matahari clan and its ancient threat."],
    ["Bintang", "Tere Liye", 400, 95000, 19, "The friends travel to the Bintang clan and face dangers beyond the known clans."],
    ["Komet", "Tere Liye", 350, 95000, 16, "The parallel-world series carries on with new allies, new clans, and new mysteries."],
    ["Ceros dan Batozar", "Tere Liye", 370, 95000, 12, "The Bumi series continues with Ali and his friends facing a threat from beyond the known clans."],
  ],
  philosophy: [
    ["Filosofi Teras", "Henry Manampiring", 346, 98000, 40, "Stoic philosophy explained for modern Indonesian life, from anxiety to everyday relationships."],
    ["Madilog", "Tan Malaka", 570, 125000, 9, "Tan Malaka's case for materialism, dialectics, and logic as the way to a rational Indonesia."],
    ["Tuhan Maha Asyik", "Sujiwo Tejo & M. Jadul Maula", 372, 89000, 14, "A playful, conversational take on faith, humor, and everyday life."],
    ["Etika Dasar", "Franz Magnis-Suseno", 230, 80000, 18, "A concise introduction to ethics and moral thinking written for Indonesian readers."],
    ["Pemikiran Karl Marx", "Franz Magnis-Suseno", 335, 95000, 6, "An accessible analysis of Marx's ideas, from utopian socialism to revisionism."],
    ["Sejarah Filsafat Yunani", "K. Bertens", 380, 90000, 13, "A survey of Greek philosophy from the pre-Socratics to Aristotle."],
    ["Manusia Indonesia", "Mochtar Lubis", 160, 75000, 21, "A sharp essay on the traits Lubis saw in the Indonesian character."],
    ["Filsafat Ilmu: Sebuah Pengantar Populer", "Jujun S. Suriasumantri", 400, 85000, 17, "An introduction to how science and knowledge are grounded in philosophy."],
    ["13 Tokoh Etika", "Franz Magnis-Suseno", 260, 90000, 8, "Thirteen thinkers who shaped ethics from ancient Greece to the nineteenth century."],
    ["Markesot Bertutur", "Emha Ainun Nadjib", 260, 80000, 11, "Satirical dialogues on politics, religion, and society through the character Markesot."],
  ],
  "business-tech": [
    ["Mereka Bilang, Saya Gila!", "Bob Sadino", 180, 78000, 20, "Bob Sadino's blunt lessons on entrepreneurship, failure, and starting without a plan."],
    ["Ciputra Quantum Leap", "Ciputra", 316, 90000, 15, "The property tycoon's view of entrepreneurship as a national growth strategy."],
    ["Chairul Tanjung Si Anak Singkong", "Tjahja Gunawan Diredja", 400, 99000, 22, "The rise of Chairul Tanjung from a modest childhood to the top of Indonesian business."],
    ["New Wave Marketing", "Hermawan Kartajaya", 300, 105000, 10, "A marketing framework for a flat, connected, and increasingly digital world."],
    ["Algoritma dan Pemrograman", "Rinaldi Munir", 450, 130000, 14, "A programming textbook that teaches algorithmic thinking step by step."],
    ["Matematika Diskrit", "Rinaldi Munir", 550, 140000, 9, "A university textbook on logic, sets, graphs, and counting for computer science students."],
    ["Rekayasa Perangkat Lunak Terstruktur dan Berorientasi Objek", "Rosa A.S. & M. Shalahuddin", 450, 135000, 12, "A guide to software engineering methods from structured analysis to object-oriented design."],
    ["Basis Data", "Fathansyah", 300, 95000, 3, "An introduction to database concepts, modeling, and SQL for beginners."],
    ["Kewirausahaan: Kiat dan Proses Menuju Sukses", "Suryana", 320, 85000, 16, "A practical guide to the process of starting and growing a business."],
    ["Buku Pegangan Internet Wireless dan Hotspot", "Onno W. Purbo", 280, 105000, 7, "A hands-on handbook for building wireless networks and hotspots."],
  ],
  "self-dev": [
    ["Mimpi Sejuta Dolar", "Merry Riana", 250, 75000, 28, "Merry Riana's story of building a career and her first million dollars after leaving for Singapore."],
    ["ESQ: Emotional Spiritual Quotient", "Ary Ginanjar Agustian", 380, 110000, 12, "A framework that joins emotional and spiritual intelligence with Islamic values for character building."],
    ["The Power of Kepepet", "Jaya Setiabudi", 260, 79000, 30, "Why pressure and necessity can push ordinary people to take bold entrepreneurial leaps."],
    ["Self Driving", "Rhenald Kasali", 280, 89000, 18, "A guide to taking control of your life as a driver instead of a passenger."],
    ["Myelin", "Rhenald Kasali", 400, 99000, 7, "How to turn intangible resources into a force for change."],
    ["Rentang Kisah", "Gita Savitri Devi", 240, 85000, 25, "Personal essays on growing up, studying abroad, and finding your own voice."],
    ["Insecurity Is My Middle Name", "Alvi Syahrin", 220, 89000, 14, "Short reflections on insecurity, self-worth, and learning to accept yourself."],
    ["Nanti Kita Cerita Tentang Hari Ini", "Marchella FP", 220, 89000, 35, "Warm, short essays on family, childhood, and getting through a hard day."],
    ["Financial Revolution", "Tung Desem Waringin", 300, 79000, 11, "A guide to money habits, saving, and working toward financial independence."],
    ["7 Keajaiban Rezeki", "Ippho Santosa", 280, 79000, 22, "A motivational book on habits, faith, and effort as the source of fortune."],
  ],
  romance: [
    ["Dilan 1990", "Pidi Baiq", 332, 89000, 34, "Milea looks back on the year she met Dilan, a quirky and poetic teenager in 1990 Bandung."],
    ["Ayat-Ayat Cinta", "Habiburrahman El Shirazy", 418, 92000, 27, "Fahri, an Indonesian student in Cairo, is caught between faith, love, and a false accusation."],
    ["Rectoverso", "Dee Lestari", 156, 89000, 19, "Eleven stories about love, each written with an accompanying song and illustration."],
    ["Critical Eleven", "Ika Natassa", 344, 99000, 23, "Anya and Ale meet on a flight and marry, then struggle when tragedy tests their marriage."],
    ["Antologi Rasa", "Ika Natassa", 350, 95000, 15, "A tangle of love and friendship among four friends in Jakarta's banking world."],
    ["Refrain", "Winna Efendi", 300, 85000, 13, "Friends, unspoken feelings, and a love that keeps coming back around."],
    ["Hujan", "Tere Liye", 320, 95000, 28, "In a future reshaped by disaster, Lail and Esok's story unfolds around rain, memory, and love."],
    ["Dear Nathan", "Erisca Febriani", 300, 79000, 31, "A high-school girl and the class troublemaker in a coming-of-age romance."],
    ["Twivortiare", "Ika Natassa", 320, 95000, 11, "The marriage of Alexandra and Beno, told through short notes and its slow breakdown."],
    ["Sunset Bersama Rosie", "Tere Liye", 400, 89000, 17, "Tegar remembers Rosie and a love that arrived at the wrong time."],
  ],
  "young-adult": [
    ["5 cm", "Donny Dhirgantoro", 380, 99000, 29, "Five friends climb Mount Semeru to test their friendship and their dreams."],
    ["Sang Pemimpi", "Andrea Hirata", 292, 95000, 24, "Ikal, Arai, and Jimbron chase the dream of studying in Paris."],
    ["Edensor", "Andrea Hirata", 300, 95000, 18, "Ikal and Arai travel across Europe following their long-held dream."],
    ["Maryamah Karpov", "Andrea Hirata", 504, 99000, 2, "Ikal returns to Belitung and searches for the girl he never forgot."],
    ["Sepatu Dahlan", "Khrisna Pabichara", 370, 95000, 16, "A poor boy in East Java grows up determined to own a pair of shoes."],
    ["Hafalan Shalat Delisa", "Tere Liye", 270, 89000, 21, "A young girl in Aceh memorizes her prayers in the days before the 2004 tsunami."],
    ["Surat Kecil untuk Tuhan", "Agnes Davonar", 220, 75000, 14, "A teenage girl facing cancer writes letters to God, based on a true story."],
    ["Ranah 3 Warna", "A. Fuadi", 470, 99000, 12, "Alif chases his dream through university in Bandung and beyond."],
    ["Rantau 1 Muara", "A. Fuadi", 400, 99000, 10, "Alif builds a career and looks for the place where his journey finally settles."],
    ["Ayah", "Andrea Hirata", 412, 99000, 20, "Sabari's devotion to his son and to a love that never fades."],
  ],
  religion: [
    ["Falsafah Hidup", "Hamka", 280, 80000, 19, "Hamka's reflections on virtue, reason, and how to live well."],
    ["Tasawuf Modern", "Hamka", 300, 85000, 22, "A modern reading of Sufism focused on happiness and a balanced life."],
    ["Di Bawah Lindungan Ka'bah", "Hamka", 130, 70000, 15, "A tender story of love and sacrifice that ends at the Holy Mosque in Mecca."],
    ["Ketika Cinta Bertasbih", "Habiburrahman El Shirazy", 460, 95000, 20, "An Indonesian student in Cairo balances hardship, faith, and an unspoken love."],
    ["Api Tauhid", "Habiburrahman El Shirazy", 570, 100000, 12, "A young man's journey through Turkey's Islamic heritage and the life of Said Nursi."],
    ["Bumi Cinta", "Habiburrahman El Shirazy", 500, 95000, 10, "A student in Moscow keeps his faith while facing hardship far from home."],
    ["Pudarnya Pesona Cleopatra", "Habiburrahman El Shirazy", 175, 60000, 25, "A young husband must learn to love the wife he did not choose."],
    ["Dalam Mihrab Cinta", "Habiburrahman El Shirazy", 400, 90000, 9, "A story of faith, a boarding-school teacher, and love tested by circumstance."],
    ["Ayat-Ayat Cinta 2", "Habiburrahman El Shirazy", 700, 100000, 24, "Fahri, now teaching in Edinburgh, faces new trials of faith and family."],
    ["Sejarah Umat Islam", "Hamka", 1000, 125000, 8, "A broad history of Muslim civilization from its beginnings to the modern era."],
  ],
  "mystery-horror": [
    ["Danur", "Risa Saraswati", 200, 89000, 26, "Risa recounts her childhood friendship with ghostly children, told as real events."],
    ["Gerbang Dialog Danur", "Risa Saraswati", 220, 89000, 18, "Risa continues her real-life encounters with spirits from the Danur world."],
    ["Sunyaruri", "Risa Saraswati", 240, 89000, 12, "A third volume of Risa's encounters, set against quiet, haunted places."],
    ["Maddah", "Risa Saraswati", 250, 89000, 10, "Another chapter in the Danur series of ghost stories told from personal experience."],
    ["KKN di Desa Penari", "SimpleMan", 250, 99000, 35, "A viral horror story about university students who stay in a remote village."],
    ["Rahasia Meede", "E.S. Ito", 600, 125000, 2, "A historical mystery about lost VOC treasure and secrets buried in Indonesia's past."],
    ["Rahasia Salinem", "Brilliant Yotenega & Sabda Armandio", 250, 85000, 14, "A mystery around a woman whose past is slowly uncovered."],
    ["Lelaki Harimau", "Eka Kurniawan", 190, 89000, 12, "A young man commits a murder, and the tiger inside him takes the blame."],
    ["Sihir Perempuan", "Intan Paramaditha", 200, 79000, 10, "Short stories that twist fairy tales and horror around women's lives."],
    ["Pintu Terlarang", "Sekar Ayu Asmara", 200, 79000, 0, "A sculptor's disturbing secrets are slowly uncovered."],
  ],
};

const palette = [
  "#8C5A3C", "#2F4B5C", "#5B6B4E", "#7A3E48", "#3E4A6B",
  "#A6753A", "#4A5A57", "#6B4E71", "#8A4B38", "#3F5E5A",
];

const daysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);

export const books = categories.flatMap((cat, c) =>
  raw[cat.slug].map(([title, author, pages, price, stock, synopsis], i) => {
    const n = c * 10 + i;
    return {
      id: `b${String(n + 1).padStart(3, "0")}`,
      title,
      author,
      category: cat.slug,
      price,
      stock,
      pages,
      chapters: Math.max(8, Math.round(pages / 25)),
      synopsis,
      content: `${synopsis}\n\nThis is a preview. The full text of this title is not included in the demo data.`,
      cover: null, // no image: UI renders the CSS placeholder using `color`
      color: palette[n % palette.length],
      addedAt: daysAgo((n * 7) % 90),
    };
  })
);

export const authors = Object.values(
  books.reduce((acc, b) => {
    b.author.split(/ & /).forEach((name) => {
      acc[name] = acc[name] || { name, books: 0 };
      acc[name].books += 1;
    });
    return acc;
  }, {})
).sort((a, b) => b.books - a.books || a.name.localeCompare(b.name));
