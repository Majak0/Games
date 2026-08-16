<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Http\UploadedFile;

class ContactMessage extends Mailable
{
    /**
     * @param  list<UploadedFile>  $files
     */
    public function __construct(
        public string $topic,
        public string $bodyText,
        public ?string $senderEmail,
        public bool $copySender,
        public ?string $username,
        public array $files = [],
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Contact Arcadia — '.$this->topic,
            replyTo: $this->senderEmail ? [new Address($this->senderEmail)] : [],
            cc: ($this->copySender && $this->senderEmail) ? [new Address($this->senderEmail)] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'emails.contact',
        );
    }

    /**
     * @return list<Attachment>
     */
    public function attachments(): array
    {
        return array_map(
            function (UploadedFile $file): Attachment {
                return Attachment::fromPath($file->getRealPath())
                    ->as($file->getClientOriginalName())
                    ->withMime($file->getMimeType() ?: 'application/octet-stream');
            },
            $this->files,
        );
    }
}
