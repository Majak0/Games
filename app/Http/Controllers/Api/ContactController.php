<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Throwable;

class ContactController extends Controller
{
    /** @var array<string, string> */
    private const SUBJECTS = [
        'question' => 'Question',
        'bug' => 'Signalement de bug',
        'suggestion' => 'Suggestion',
        'compte' => 'Compte / connexion',
        'autre' => 'Autre',
    ];

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', Rule::in(array_keys(self::SUBJECTS))],
            'subject_custom' => ['required_if:subject,autre', 'nullable', 'string', 'max:120'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            'email' => [
                Rule::requiredIf(fn () => $request->boolean('copy_sender')),
                'nullable',
                'email',
                'max:255',
            ],
            'copy_sender' => ['sometimes', 'boolean'],
            'attachments' => ['sometimes', 'array', 'max:3'],
            'attachments.*' => ['file', 'max:4096', 'mimes:jpg,jpeg,png,gif,webp,pdf,txt,csv,zip,doc,docx'],
        ], [
            'subject.required' => 'Veuillez choisir un objet.',
            'subject_custom.required_if' => 'Veuillez préciser l\'objet du message.',
            'message.required' => 'Veuillez rédiger un message.',
            'message.min' => 'Le message doit contenir au moins 10 caractères.',
            'email.required' => 'Indiquez votre e-mail pour être ajouté en copie.',
            'email.email' => 'L\'adresse e-mail n\'est pas valide.',
            'attachments.max' => 'Vous pouvez joindre au plus 3 fichiers.',
            'attachments.*.max' => 'Chaque fichier ne doit pas dépasser 4 Mo.',
            'attachments.*.mimes' => 'Format de fichier non accepté.',
        ]);

        $topic = $validated['subject'] === 'autre'
            ? $validated['subject_custom']
            : self::SUBJECTS[$validated['subject']];

        $copySender = $request->boolean('copy_sender');
        $senderEmail = filled($validated['email'] ?? null) ? $validated['email'] : null;

        $files = $request->file('attachments', []);

        if ($files instanceof UploadedFile) {
            $files = [$files];
        }

        $files = is_array($files) ? array_values($files) : [];

        $recipient = config('mail.contact.address');
        if (! is_string($recipient) || ! filled($recipient)) {
            Log::error('Contact form: MAIL_CONTACT_ADDRESS is not configured.');

            return response()->json([
                'message' => 'L\'envoi du message a échoué. Réessayez dans un instant.',
            ], 500);
        }

        try {
            Mail::to($recipient)->send(new ContactMessage(
                topic: $topic,
                bodyText: $validated['message'],
                senderEmail: $senderEmail,
                copySender: $copySender,
                username: $request->user()?->username,
                files: $files,
            ));
        } catch (Throwable $exception) {
            report($exception);
            Log::error('Contact form: mail send failed.', [
                'exception' => $exception->getMessage(),
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'from' => config('mail.from.address'),
            ]);

            $message = config('app.debug')
                ? 'L\'envoi a échoué : '.$exception->getMessage()
                : 'L\'envoi du message a échoué. Réessayez dans un instant.';

            return response()->json([
                'message' => $message,
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'message' => 'Votre message a bien été envoyé.',
        ]);
    }
}
