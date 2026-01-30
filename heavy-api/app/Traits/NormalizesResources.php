<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;

trait NormalizesResources
{
    /**
     * Boot the trait to hook into the model events.
     */
    protected static function bootNormalizesResources(): void
    {
        static::saving(function (Model $model) {
            $model->normalizeAttributes();
        });
    }

    /**
     * Normalize attributes based on the defined rules.
     */
    public function normalizeAttributes(): void
    {
        if (!property_exists($this, 'normalizableAttributes')) {
            return;
        }

        foreach ($this->normalizableAttributes as $attribute => $rule) {
            // Only normalize if the attribute is present and dirty (or always? usually on save we want to ensure it)
            // If we only do checks on isDirty(), we save performance.
            // However, checking existence is enough for 'saving'.
            
            if ($this->getAttribute($attribute) !== null) {
                 $originalValue = $this->getAttribute($attribute);
                 $normalizedValue = $this->applyNormalizationRule($originalValue, $rule);

                 if ($originalValue !== $normalizedValue) {
                     $this->setAttribute($attribute, $normalizedValue);
                 }
            }
        }
    }

    /**
     * Apply the specific normalization rule.
     *
     * @param string $value
     * @param string $rule
     * @return string
     */
    protected function applyNormalizationRule($value, string $rule): string
    {
        // Always trim first
        $value = trim($value);

        return match ($rule) {
            'title' => mb_convert_case($value, MB_CASE_TITLE, 'UTF-8'),
            'upper', 'code', 'serial' => mb_convert_case($value, MB_CASE_UPPER, 'UTF-8'),
            'sentence', 'description' => $this->mb_ucfirst($value),
            default => $value,
        };
    }

    /**
     * Multibyte basic sentence case (first letter upper).
     *
     * @param string $string
     * @return string
     */
    protected function mb_ucfirst(string $string): string
    {
        if (empty($string)) {
            return $string;
        }
        
        $encoding = 'UTF-8';
        $firstChar = mb_substr($string, 0, 1, $encoding);
        $then = mb_substr($string, 1, null, $encoding);
        
        return mb_strtoupper($firstChar, $encoding) . $then;
    }
}
