<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tabela de esquemas de comissionamento
        Schema::create('commission_schemes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Tabela de tiers de comissão (compras)
        Schema::create('commission_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scheme_id')->constrained('commission_schemes')->onDelete('cascade');
            $table->enum('stage', ['FIRST', 'SUBSEQUENT']); // Primeira compra vs subsequentes
            $table->integer('level'); // Nível na árvore (1, 2, 3)
            $table->decimal('percent', 5, 2); // Percentual (15.00, 8.00, etc)
            $table->timestamps();
            
            $table->index(['scheme_id', 'stage', 'level']);
        });

        // 3. Tabela de tiers residuais (sobre lucros)
        Schema::create('residual_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scheme_id')->constrained('commission_schemes')->onDelete('cascade');
            $table->integer('level'); // Nível na árvore (1, 2, 3)
            $table->decimal('percent', 5, 2); // Percentual residual (2.50, 0.50, 0.15)
            $table->timestamps();
            
            $table->index(['scheme_id', 'level']);
        });

        // 4. Seed inicial
        $this->seedInitialData();
    }

    /**
     * Seed dados iniciais
     */
    private function seedInitialData(): void
    {
        // Criar esquema padrão
        $schemeId = DB::table('commission_schemes')->insertGetId([
            'name' => 'Esquema Padrão MMN',
            'is_active' => true,
            'description' => 'Esquema de comissionamento padrão do sistema',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Commission Tiers - FIRST PURCHASE (Primeira compra)
        DB::table('commission_tiers')->insert([
            [
                'scheme_id' => $schemeId,
                'stage' => 'FIRST',
                'level' => 1,
                'percent' => 15.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'scheme_id' => $schemeId,
                'stage' => 'FIRST',
                'level' => 2,
                'percent' => 2.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'scheme_id' => $schemeId,
                'stage' => 'FIRST',
                'level' => 3,
                'percent' => 1.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Commission Tiers - SUBSEQUENT PURCHASES (Compras subsequentes)
        DB::table('commission_tiers')->insert([
            [
                'scheme_id' => $schemeId,
                'stage' => 'SUBSEQUENT',
                'level' => 1,
                'percent' => 8.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'scheme_id' => $schemeId,
                'stage' => 'SUBSEQUENT',
                'level' => 2,
                'percent' => 2.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'scheme_id' => $schemeId,
                'stage' => 'SUBSEQUENT',
                'level' => 3,
                'percent' => 1.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Residual Tiers (Sobre lucros/rendimentos)
        DB::table('residual_tiers')->insert([
            [
                'scheme_id' => $schemeId,
                'level' => 1,
                'percent' => 2.50,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'scheme_id' => $schemeId,
                'level' => 2,
                'percent' => 0.50,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'scheme_id' => $schemeId,
                'level' => 3,
                'percent' => 0.15,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('residual_tiers');
        Schema::dropIfExists('commission_tiers');
        Schema::dropIfExists('commission_schemes');
    }
};

