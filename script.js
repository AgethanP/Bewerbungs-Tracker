// ==========================================
// Gemeinsame Funktionen für beide Seiten
// ==========================================

// Holt die Bewerbungen aus dem Local Storage. Wenn keine da sind, wird ein leeres Array erstellt.
function getBewerbungen() {
    let speicher = localStorage.getItem('bewerbungen');
    if (speicher === null) {
        return [];
    } else {
        return JSON.parse(speicher);
    }
}

// Speichert das Array mit Bewerbungen wieder im Local Storage
function saveBewerbungen(bewerbungenArray) {
    localStorage.setItem('bewerbungen', JSON.stringify(bewerbungenArray));
}


// ==========================================
// Logik für die Startseite (index.html)
// ==========================================

// Diese Funktion baut das HTML für die Liste auf
function renderListe() {
    // Prüfen, ob wir auf der Startseite sind
    const listenContainer = document.getElementById('bewerbungs-liste');
    if (!listenContainer) return; 

    const bewerbungen = getBewerbungen();
    listenContainer.innerHTML = ''; 

    if (bewerbungen.length === 0) {
        listenContainer.innerHTML = '<p>Noch keine Bewerbungen eingetragen. Klicke oben auf "+ Neue Bewerbung".</p>';
        return;
    }

    // Für jede Bewerbung im Array eine HTML-Karte erstellen
    bewerbungen.forEach((bew, index) => {
        
        let linkHtml = bew.link ? `<a href="${bew.link}" target="_blank">Zur Anzeige</a>` : 'Kein Link';
        let notizenHtml = bew.notizen ? bew.notizen.replace(/\n/g, '<br>') : '-';

        // NEU: Datum von YYYY-MM-DD in DD.MM.YYYY umwandeln
        let anzeigeDatum = bew.datum; 
        if (bew.datum) {
            // split('-') zerschneidet z.B. "2026-10-18" in ["2026", "10", "18"]
            // reverse() dreht es um in ["18", "10", "2026"]
            // join('.') klebt es zusammen zu "18.10.2026"
            anzeigeDatum = bew.datum.split('-').reverse().join('.');
        }

        // Die HTML-Struktur der Karte (hier wurde bew.datum durch anzeigeDatum ersetzt)
        let karte = `
            <div class="bewerbung-eintrag">
                <h3>${bew.firma} - ${bew.jobtitel}</h3>
                <p><strong>Bewerbungsdatum:</strong> ${anzeigeDatum}</p>
                <p><strong>Plattform:</strong> ${bew.plattform}</p>
                <p><strong>Link:</strong> ${linkHtml}</p>
                
                <p><strong>Status:</strong> 
                    <select onchange="ändereStatus(${index}, this.value)">
                        <option value="Offen" ${bew.status === 'Offen' ? 'selected' : ''}>Offen</option>
                        <option value="Gespräch" ${bew.status === 'Gespräch' ? 'selected' : ''}>Gespräch</option>
                        <option value="Zusage" ${bew.status === 'Zusage' ? 'selected' : ''}>Zusage</option>
                        <option value="Abgelehnt" ${bew.status === 'Abgelehnt' ? 'selected' : ''}>Abgelehnt</option>
                    </select>
                </p>
                
                <p><strong>Notizen:</strong><br> ${notizenHtml}</p>
                
                <button onclick="bearbeiteBewerbung(${index})">Bearbeiten</button>
                <button onclick="löscheBewerbung(${index})">Löschen</button>
            </div>
        `;
        listenContainer.innerHTML += karte;
    });
}
// Wird aufgerufen, wenn im Dropdown ein neuer Status gewählt wird
function ändereStatus(index, neuerStatus) {
    let bewerbungen = getBewerbungen();
    bewerbungen[index].status = neuerStatus;
    saveBewerbungen(bewerbungen);
}

// Wird aufgerufen, wenn "Löschen" geklickt wird
function löscheBewerbung(index) {
    let bewerbungen = getBewerbungen();
    let bestätigung = confirm(`Möchtest du die Bewerbung bei "${bewerbungen[index].firma}" wirklich löschen?`);
    
    if (bestätigung) {
        bewerbungen.splice(index, 1); // Entfernt 1 Element an der Position 'index'
        saveBewerbungen(bewerbungen);
        renderListe(); // Liste sofort neu laden
    }
}

// Wird aufgerufen, wenn "Bearbeiten" geklickt wird
function bearbeiteBewerbung(index) {
    // Wir speichern den Index der zu bearbeitenden Bewerbung temporär
    sessionStorage.setItem('bearbeitenIndex', index);
    // Und leiten dann auf die Formular-Seite weiter
    window.location.href = 'neu.html';
}


// ==========================================
// Logik für die Formular-Seite (neu.html)
// ==========================================

function initFormular() {
    // Prüfen, ob wir auf der Formular-Seite sind
    const formular = document.getElementById('bewerbungs-formular');
    if (!formular) return;

    // Prüfen, ob wir im Bearbeiten-Modus sind
    const bearbeitenIndex = sessionStorage.getItem('bearbeitenIndex');
    
    if (bearbeitenIndex !== null) {
        // Formular-Überschrift anpassen (optional, falls vorhanden)
        const ueberschrift = document.querySelector('main h2');
        if(ueberschrift) ueberschrift.innerText = "Bewerbung bearbeiten";

        // Daten der zu bearbeitenden Bewerbung holen
        const bewerbungen = getBewerbungen();
        const bew = bewerbungen[bearbeitenIndex];

        // Formularfelder mit den alten Daten füllen
        document.getElementById('firma').value = bew.firma;
        document.getElementById('jobtitel').value = bew.jobtitel;
        document.getElementById('datum').value = bew.datum;
        document.getElementById('plattform').value = bew.plattform || '';
        document.getElementById('link').value = bew.link || '';
        document.getElementById('status').value = bew.status;
        document.getElementById('notizen').value = bew.notizen || '';
    }

    // Was passiert, wenn das Formular abgeschickt wird?
    formular.addEventListener('submit', function(event) {
        event.preventDefault(); // Verhindert das Standard-Neuladen der Seite

        // Neue Daten aus den Feldern auslesen
        let neuerEintrag = {
            firma: document.getElementById('firma').value,
            jobtitel: document.getElementById('jobtitel').value,
            datum: document.getElementById('datum').value,
            plattform: document.getElementById('plattform').value,
            link: document.getElementById('link').value,
            status: document.getElementById('status').value,
            notizen: document.getElementById('notizen').value
        };

        let bewerbungen = getBewerbungen();

        if (bearbeitenIndex !== null) {
            // Wir überschreiben die bestehende Bewerbung
            bewerbungen[bearbeitenIndex] = neuerEintrag;
            sessionStorage.removeItem('bearbeitenIndex'); // Bearbeitungsmodus beenden
        } else {
            // Es ist eine komplett neue Bewerbung, also ans Array anhängen
            bewerbungen.push(neuerEintrag);
        }

        saveBewerbungen(bewerbungen);
        
        // Nach dem Speichern zurück zur Startseite leiten
        window.location.href = 'index.html';
    });
}


// ==========================================
// Start der Skripte
// ==========================================

// Wenn die Seite komplett geladen ist, führen wir die Funktionen aus
window.onload = function() {
    renderListe();    // Versucht die Liste zu rendern (passiert nur auf index.html)
    initFormular();   // Versucht das Formular zu initialisieren (passiert nur auf neu.html)
};