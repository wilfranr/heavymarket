<?php

namespace App\Validation;

use Illuminate\Validation\Validator as BaseValidator;

class CustomValidator extends BaseValidator
{
    /**
     * Validate that an attribute is an active image.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function validateImage($attribute, $value, $parameters = [])
    {
        return $this->validateMimes($attribute, $value, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'avif']);
    }
}
