<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <title>Contact Arcadia</title>
    </head>
    <body style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <p>Nouveau message reçu depuis le formulaire de contact Arcadia.</p>
        <p>
            <strong>Objet :</strong> {{ $topic }}<br>
            <strong>Expéditeur :</strong> {{ $senderEmail ?: 'Non renseigné' }}<br>
            <strong>Compte :</strong> {{ $username ?: 'Visiteur' }}<br>
            <strong>Copie demandée :</strong> {{ $copySender ? 'Oui' : 'Non' }}
        </p>
        <hr>
        <p style="white-space: pre-wrap;">{{ $bodyText }}</p>
    </body>
</html>
