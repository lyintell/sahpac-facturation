- Ceci est une application qui permet de facturer les clients et enregistrer les paiements. Je l'avais commencer sur Lovable, maintenant transferer sur mon ordi.
Parcours les dossiers du projet pour comprendre le projet en entier.
Documente dans le fichier 0_docs/project.md. Simplifie la documentation.
Specifiquement:
- Decris le projet.
- Les features
- La structure du projet (dossier et fichier)
- L'architecture (tech stack)
- Autre details pertinents

Puis on continuera le travail.

- J'obtient une erreur lors de la création d'une facture. Dans le console j'obtient:
    code
    : 
    "23505"
    details
    : 
    null
    hint
    : 
    null
    message
    : 
    "duplicate key value violates unique constraint \"invoices_unique_number_per_type\""
    [[Prototype]]
    : 
    Object

- Dans l'application web, remplace le badge Lovable par le logo de l'application

- Dans la facture (apercu et PDF), n'affiche pas le prix dans les types d'intervention (apres la description).

- Dans la facture (apercu et PDF), si # type d intervention > 1, Total HT et Total TTC en bold (total par type d'intervention en regular - pas bold)

- Dans le mode edition de la facture, le montant de la facture n'est pas reporter - affiche 0. Fix ca
