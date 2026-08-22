<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Repository\TaxonomyRepository;
use App\Security\Principal;
use App\Support\Validator;

final class TaxonomyController
{
    private TaxonomyRepository $taxonomy;

    public function __construct()
    {
        $this->taxonomy = new TaxonomyRepository();
    }

    /** @param array<string, string> $params */
    public function categories(Request $request, ?Principal $principal, array $params): Response
    {
        return Response::json(['status' => true, 'data' => $this->taxonomy->categories()]);
    }

    /** @param array<string, string> $params */
    public function tags(Request $request, ?Principal $principal, array $params): Response
    {
        return Response::json(['status' => true, 'data' => $this->taxonomy->tags()]);
    }

    /** @param array<string, string> $params */
    public function createCategory(Request $request, ?Principal $principal, array $params): Response
    {
        $validator = Validator::for($request->json());
        $name      = $validator->requiredString('name', 2, 160);
        $validator->validate();

        $id = $this->taxonomy->createCategory($name);

        return Response::json(['status' => true, 'message' => 'Category created.', 'data' => ['id' => $id]], 201);
    }

    /** @param array<string, string> $params */
    public function updateCategory(Request $request, ?Principal $principal, array $params): Response
    {
        $validator = Validator::for($request->json());
        $name      = $validator->requiredString('name', 2, 160);
        $validator->validate();

        $this->taxonomy->updateCategory((int) $params['id'], $name);

        return Response::json(['status' => true, 'message' => 'Category updated.']);
    }

    /** @param array<string, string> $params */
    public function deleteCategory(Request $request, ?Principal $principal, array $params): Response
    {
        $id = (int) $params['id'];

        // Deleting a category would silently un-categorise its courses (the FK
        // is ON DELETE SET NULL). Refusing while it is in use makes the
        // consequence something the admin has to choose, not discover.
        $inUse = $this->taxonomy->categoryUsageCount($id);
        if ($inUse > 0) {
            throw HttpException::conflict(
                sprintf('%d course%s still use this category. Move them first.', $inUse, $inUse === 1 ? '' : 's')
            );
        }

        $this->taxonomy->deleteCategory($id);

        return Response::json(['status' => true, 'message' => 'Category deleted.']);
    }

    /** @param array<string, string> $params */
    public function createTag(Request $request, ?Principal $principal, array $params): Response
    {
        $validator = Validator::for($request->json());
        $title     = $validator->requiredString('title', 2, 120);
        $validator->validate();

        $id = $this->taxonomy->createTag($title);

        return Response::json(['status' => true, 'message' => 'Tag created.', 'data' => ['id' => $id]], 201);
    }

    /** @param array<string, string> $params */
    public function updateTag(Request $request, ?Principal $principal, array $params): Response
    {
        $validator = Validator::for($request->json());
        $title     = $validator->requiredString('title', 2, 120);
        $validator->validate();

        $this->taxonomy->updateTag((int) $params['id'], $title);

        return Response::json(['status' => true, 'message' => 'Tag updated.']);
    }

    /** @param array<string, string> $params */
    public function deleteTag(Request $request, ?Principal $principal, array $params): Response
    {
        $id    = (int) $params['id'];
        $inUse = $this->taxonomy->tagUsageCount($id);

        if ($inUse > 0) {
            throw HttpException::conflict(
                sprintf('%d course%s still use this tag. Remove it from them first.', $inUse, $inUse === 1 ? '' : 's')
            );
        }

        $this->taxonomy->deleteTag($id);

        return Response::json(['status' => true, 'message' => 'Tag deleted.']);
    }
}
