<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Upload de imagem para planos
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120', // 5MB max
        ]);

        try {
            $file = $request->file('image');
            $filename = 'plans/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            
            // Salvar no storage público
            $path = $file->storeAs('public', $filename);
            
            // Retornar URL pública (usar asset() para garantir URL completa)
            $url = asset('storage/' . $filename);

            return response()->json([
                'data' => [
                    'url' => $url,
                    'path' => $filename,
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => [
                    'code' => 'UPLOAD_ERROR',
                    'message' => 'Erro ao fazer upload da imagem: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }
}

