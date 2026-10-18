// ==========================================
// 1. SUPABASE KONFIGURATION (Hier deine Daten eintragen!)
// ==========================================
const SUPABASE_URL = 'https://kolmuskfcherwvfthorc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gno7z0y4GFP37-Ii_Vw70A_wqGyeDG2';

// Initialisierung des Supabase-Clients
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ==========================================
// Gemeinsame Funktionen (Daten aus Supabase laden)
// ==========================================

// Holt alle Bewerbungen aus der Supabase-Datenbank (asynchron)
async function getBewerbungen() {
    let { data, error } = await supabaseClient
        .from('Bewerbungen')
        .select('*')
        .order('datum', { ascending: false }); // Neueste zuerst

    if (error) {
        console.error('Fehler beim Laden:', error);
        return [];
    }
    return data || [];
}


// ==========================================
// Logik für die Startseite (index.html)
// ==========================================

async function renderListe() {
    const listenContainer = document.getElementById('bewerbungs-liste');
    if (!listenContainer) return; 

    listenContainer.innerHTML = '<p>Lade Bewerbungen aus der Cloud...</p>';

    const bewerbungen = await getBewerbungen();
    listenContainer.innerHTML = ''; 

    if (bewerbungen.length === 0) {
        listenContainer.innerHTML = '<p>Noch keine Bewerbungen eingetragen. Klicke oben auf "+ Neue Bewerbung".</p>';
        return;
    }

    bewerbungen.forEach((bew) => {
        let linkHtml = bew.link ? `<a href="${bew.link}" target="_blank">Zur Anzeige</a>` : 'Kein Link';
        let notizenHtml = bew.notizen ? bew.notizen.replace(/\n/g, '<br>') : '-';

        let anzeigeDatum = bew.datum; 
        if (bew.datum) {
            anzeigeDatum = bew.datum.split('-').reverse().join('.');
        }

        // Wir nutzen hier die 'id' aus der Datenbank statt des Array-Indexes
        let karte = `
            <div class="bewerbung-eintrag">
                <h3>${bew.firma} - ${bew.jobtitel}</h3>
                <p><strong>Bewerbungsdatum:</strong> ${anzeigeDatum}</p>
                <p><strong>Plattform:</strong> ${bew.plattform || '-'}</p>
                <p><strong>Link:</strong> ${linkHtml}</p>
                
                <p><strong>Status:</strong> 
                    <select onchange="ändereStatus('${bew.id}', this.value)">
                        <option value="Offen" ${bew.status === 'Offen' ? 'selected' : ''}>Offen</option>
                        <option value="Gespräch" ${bew.status === 'Gespräch' ? 'selected' : ''}>Gespräch</option>
                        <option value="Zusage" ${bew.status === 'Zusage' ? 'selected' : ''}>Zusage</option>
                        <option value="Abgelehnt" ${bew.status === 'Abgelehnt' ? 'selected' : ''}>Abgelehnt</option>
                    </select>
                </p>
                
                <p><strong>Notizen:</strong><br> ${notizenHtml}</p>
                
                <button onclick="bearbeiteBewerbung('${bew.id}')">Bearbeiten</button>
                <button onclick="löscheBewerbung('${bew.id}')">Löschen</button>
            </div>
        `;
        listenContainer.innerHTML += karte;
    });
}

// Status direkt in der Datenbank aktualisieren
async function ändereStatus(id, neuerStatus) {
    const { error } = await supabaseClient
        .from('bewerbungen')
        .update({ status: neuerStatus })
        .eq('id', id);

    if (error) {
        console.error('Fehler beim Status-Ändern:', error);
        alert('Fehler beim Aktualisieren des Status.');
    }
}

// Bewerbung löschen
async function löscheBewerbung(id) {
    let bestätigung = confirm('Möchtest du diese Bewerbung wirklich löschen?');
    if (!bestätigung) return;

    const { error } = await supabaseClient
        .from('bewerbungen')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen.');
    } else {
        renderListe(); // Liste neu laden
    }
}

// Weiterleitung zum Bearbeiten
function bearbeiteBewerbung(id) {
    sessionStorage.setItem('bearbeitenId', id);
    window.location.href = 'neu.html';
}


// ==========================================
// Logik für die Formular-Seite (neu.html)
// ==========================================

async function initFormular() {
    const formular = document.getElementById('bewerbungs-formular');
    if (!formular) return;

    const bearbeitenId = sessionStorage.getItem('bearbeitenId');
    
    if (bearbeitenId !== null) {
        const ueberschrift = document.querySelector('main h2');
        if(ueberschrift) ueberschrift.innerText = "Bewerbung bearbeiten";

        // Einzelnen Datensatz aus Supabase holen
        const { data, error } = await supabaseClient
            .from('bewerbungen')
            .select('*')
            .eq('id', bearbeitenId)
            .single();

        if (data) {
            document.getElementById('firma').value = data.firma || '';
            document.getElementById('jobtitel').value = data.jobtitel || '';
            document.getElementById('datum').value = data.datum || '';
            document.getElementById('plattform').value = data.plattform || '';
            document.getElementById('link').value = data.link || '';
            document.getElementById('status').value = data.status || 'Offen';
            document.getElementById('notizen').value = data.notizen || '';
        }
    }

    // Formular absenden (Speichern oder Aktualisieren)
    formular.addEventListener('submit', async function(event) {
        event.preventDefault(); 

        let neuerEintrag = {
            firma: document.getElementById('firma').value,
            jobtitel: document.getElementById('jobtitel').value,
            datum: document.getElementById('datum').value,
            plattform: document.getElementById('plattform').value,
            link: document.getElementById('link').value,
            status: document.getElementById('status').value,
            notizen: document.getElementById('notizen').value
        };

        if (bearbeitenId !== null) {
            // Update in Supabase
            const { error } = await supabaseClient
                .from('bewerbungen')
                .update(neuerEintrag)
                .eq('id', bearbeitenId);

            sessionStorage.removeItem('bearbeitenId');
            if (error) console.error('Fehler beim Update:', error);
        } else {
            // Neu einfügen in Supabase
            const { error } = await supabaseClient
                .from('bewerbungen')
                .insert([neuerEintrag]);

            if (error) console.error('Fehler beim Einfügen:', error);
        }
        
        window.location.href = 'index.html';
    });
}


// ==========================================
// Start der Skripte beim Laden der Seite
// ==========================================

window.onload = function() {
    renderListe();    
    initFormular();   
};