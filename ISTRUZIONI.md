Devi creare un sito web per organizzare le grigliate: il nome dell'app è GrigliApp.

L'applicazione deve essere responsive e funzionare principalmente su mobile.
Lo scopo dell'applicazione è aiutare ad organizzare e partecipare alle grigliate in modo semplice e veloce.
Di seguito descrivo nel dettaglio tutte le funzionalità da inserire nell'applicazione. Devi creare un'applicazione completa e funzionante. In particolare, ogni funzionalità che richiede la presenza di un database deve essere implementata con Supabase. Dammi le indicazioni necessarie per implementare il database e le relative tabelle. Poi caricherò il progetto su github, dovrai darmi indicazioni su come procedere.

Nella schermata principale ci deve essere:
- un logo in cui un maiale che beve birra davanti a una griglia (da creare con Nano Banana 2).
- un pulsante "Crea la tua grigliata" che porta alla pagina di creazione della grigliata.
- un pulsante "Partecipa" che porta alla pagina di partecipazione alla grigliata.
- un icona di login in alto a destra per gli organizzatori.
- un piè di pagina con i nomi dei creatori: Bortolato, Gomiero, Brognera, Saccon.

Pagina di creazione:
- un campo di testo per il nome della grigliata.
- un campo di testo per il nome del creatore.
- la data, ora e luogo (geolocalizzato) della grigliata.
- il cibo e le bevande che si vogliono preparare.
- un campo Note in cui scrivere cose da comprare o da fare.
- un pulsante "Crea grigliata" che crea un link da condividere ai partecipanti e salva la grigliata nel database.

Pagina di partecipazione:
- codice grigliata.
- nome.
- cognome.
- cibi e bevande che si vogliono consumare (in base a quelli disponibili per quella grigliata)
- un pulsante "Aggiungi al calendario".
- un pulsante "Portami lì" con un'icona delle mappe che apre google maps con il luogo della grigliata.

Pagina di login:
- crea un account (nome, cognome, email, password)
- accedi con email e password
- recupera password

Pagina degli organizzatori:
- lista delle grigliate create dall'organizzatore.
- per ogni grigliata ci deve essere un pulsante "Modifica" che porta alla pagina di modifica della grigliata.
- per ogni grigliata ci deve essere un pulsante "Elimina" che elimina la grigliata.
- per ogni grigliata ci deve essere un pulsante "Condividi" che copia il link della grigliata negli appunti.
- per ogni grigliata ci deve essere un pulsante "Partecipanti" che mostra la lista dei partecipanti (e quanti sono).
- per ogni grigliata ci deve essere un pulsante "Cibo e bevande" che mostra la lista dei cibi e bevande richieste dai partecipanti.

Cibi e bevande disponibili:
Carne: costine, salsiccia, salamella, coscia di pollo, sovraccoscia di pollo, petto di pollo, bistecca di coppa, pancetta, arrosticini, hamburger, spiedini
Bevande: acqua, coca cola, aranciata, the limone, the pesca
Alcolici: birra, vino rosso, vino bianco, prosecco, aperol, campari, gin
Contorni: patatine fritte, patate al forno, polenta, peperoni, zucchine, cipolla, melanzane, pomodori, insalata
Formaggi: asiago, cheddar, mozzarella, scamorza, spalmabile, sottiletta
Salse: maionese, ketchup, senape, salsa barbecue, salsa rosa, salsa piccante
Dolci: tiramisù, panna cotta, gelato, frutta, cheesecake, crostata, torta al cioccolato
