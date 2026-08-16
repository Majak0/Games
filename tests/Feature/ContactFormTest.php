<?php

namespace Tests\Feature;

use App\Mail\ContactMessage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactFormTest extends TestCase
{
    public function test_contact_page_is_served_by_the_spa(): void
    {
        $this->get('/contact')->assertOk();
    }

    public function test_contact_message_is_sent_with_copy_and_attachment(): void
    {
        Mail::fake();

        $response = $this->post('/api/contact', [
            'subject' => 'question',
            'message' => 'Bonjour, j’ai une question sur le quiz.',
            'email' => 'joueur@example.com',
            'copy_sender' => '1',
            'attachments' => [
                UploadedFile::fake()->create('note.txt', 20, 'text/plain'),
            ],
        ]);

        $response->assertOk()->assertJson([
            'ok' => true,
        ]);

        Mail::assertSent(ContactMessage::class, function (ContactMessage $mail): bool {
            return $mail->topic === 'Question'
                && $mail->senderEmail === 'joueur@example.com'
                && $mail->copySender === true
                && count($mail->files) === 1;
        });
    }

    public function test_copy_sender_requires_an_email(): void
    {
        Mail::fake();

        $this->post('/api/contact', [
            'subject' => 'suggestion',
            'message' => 'Voici une suggestion pour Arcadia.',
            'copy_sender' => '1',
        ])->assertUnprocessable();

        Mail::assertNothingSent();
    }
}
