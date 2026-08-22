<?php

declare(strict_types=1);

namespace App\Security;

/**
 * The authenticated caller.
 *
 * Everything on it comes from a token this process verified, or from the local
 * mirror row keyed by that token's `sub`. Nothing here is client-supplied.
 */
final class Principal
{
    /**
     * @param list<string> $roles       Realm roles from the token.
     * @param list<string> $permissions Derived from the roles by Permission::forRoles().
     */
    public function __construct(
        public readonly string $subject,
        public readonly string $email,
        public readonly string $name,
        public readonly array $roles,
        public readonly array $permissions,
        public readonly string $role,
        public readonly int $userId,
        public readonly ?string $sessionState,
        public readonly int $tokenExpiresAt,
    ) {
    }

    public function can(string $permission): bool
    {
        return \in_array($permission, $this->permissions, true);
    }

    public function isAdmin(): bool
    {
        return $this->role === Permission::ROLE_ADMIN;
    }

    public function isTeacher(): bool
    {
        return $this->role === Permission::ROLE_TEACHER;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'id'          => $this->userId,
            'subject'     => $this->subject,
            'name'        => $this->name,
            'email'       => $this->email,
            'role'        => $this->role,
            'roles'       => $this->roles,
            'permissions' => $this->permissions,
        ];
    }
}
