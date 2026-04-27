<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    protected $primaryKey = 'user_id';
    public $incrementing  = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'password_hash',
        'profile_photo_url',
        'role',
        'is_blocked',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'is_blocked' => 'boolean',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'uid'  => $this->user_id,
            'role' => $this->role,
        ];
    }

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function listings()
    {
        return $this->hasMany(Listing::class, 'seller_id', 'user_id');
    }

    public function interestedListings()
    {
        return $this->hasMany(Listing::class, 'interested_buyer_id', 'user_id');
    }
}
