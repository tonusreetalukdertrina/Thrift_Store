<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Cloudinary\Api\Upload\UploadApi;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected Cloudinary $cloudinary;
    protected string $folder;

    public function __construct(string $folder = 'thrift-store')
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name') ?? env('CLOUDINARY_CLOUD_NAME'),
                'api_key'    => config('services.cloudinary.api_key') ?? env('CLOUDINARY_API_KEY'),
                'api_secret' => config('services.cloudinary.api_secret') ?? env('CLOUDINARY_API_SECRET'),
            ],
        ]);
        $this->folder = $folder;
    }

    public function uploadImage($file, ?string $publicId = null): string
    {
        try {
            $options = [
                'folder' => $this->folder,
                'resource_type' => 'image',
                'quality' => 'auto',
                'fetch_format' => 'auto',
            ];

            if ($publicId) {
                $options['public_id'] = $publicId;
            }

            $result = $this->cloudinary->uploadApi()->upload($file->getPathname(), $options);

            return $result['secure_url'];
        } catch (\Exception $e) {
            Log::error('Cloudinary upload failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function deleteImage(string $url): bool
    {
        try {
            $publicId = $this->extractPublicId($url);
            if (! $publicId) {
                return false;
            }

            $result = $this->cloudinary->uploadApi()->destroy($publicId);
            return $result['result'] === 'ok';
        } catch (\Exception $e) {
            Log::error('Cloudinary delete failed: ' . $e->getMessage());
            return false;
        }
    }

    public function deleteImages(array $urls): void
    {
        foreach ($urls as $url) {
            $this->deleteImage($url);
        }
    }

    public function isCloudinaryUrl(string $url): bool
    {
        return str_contains($url, 'cloudinary.com');
    }

    protected function extractPublicId(string $url): ?string
    {
        if (! $this->isCloudinaryUrl($url)) {
            return null;
        }

        preg_match('/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/', $url, $matches);
        return $matches[1] ?? null;
    }
}
