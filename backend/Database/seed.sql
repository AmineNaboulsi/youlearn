-- =============================================================================
-- YouLearn — development seed.
--
-- The three user rows mirror the users pinned in keycloak/realm/youlearn-realm.json.
-- Their `keycloak_id` values match the `id` fields in that file, so a fresh
-- `docker compose up` gives you a database and an IdP that already agree.
-- In any other environment these rows are created just-in-time on first login
-- instead; nothing here is required for the app to run.
-- =============================================================================

-- The initdb runner invokes the client once per file, so the connection
-- charset has to be declared here too. Without it the accented French titles
-- below are read as latin1 and stored double-encoded.
SET NAMES utf8mb4;

USE youlearn;

INSERT INTO users (keycloak_id, name, email, role, is_active) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Amine Naboulsi', 'admin@youlearn.local',   'admin',      1),
  ('22222222-2222-4222-8222-222222222222', 'Nora Benali',    'teacher@youlearn.local', 'enseignant', 1),
  ('33333333-3333-4333-8333-333333333333', 'Yassine Rahmani','student@youlearn.local', 'etudiant',   1);

INSERT INTO categories (name, slug) VALUES
  ('Développement Web',          'developpement-web'),
  ('Marketing Digital',          'marketing-digital'),
  ('Design Graphique',           'design-graphique'),
  ('Langues',                    'langues'),
  ('Business & Entrepreneuriat', 'business-entrepreneuriat'),
  ('Développement Personnel',    'developpement-personnel');

INSERT INTO tags (title, slug) VALUES
  ('HTML/CSS',            'html-css'),
  ('JavaScript',          'javascript'),
  ('PHP',                 'php'),
  ('SEO',                 'seo'),
  ('Adobe Photoshop',     'adobe-photoshop'),
  ('Social Media',        'social-media'),
  ('WordPress',           'wordpress'),
  ('UI/UX',               'ui-ux'),
  ('Débutant',            'debutant'),
  ('Avancé',              'avance'),
  ('Marketing Analytics', 'marketing-analytics'),
  ('E-commerce',          'e-commerce'),
  ('Gestion de Projet',   'gestion-de-projet'),
  ('Communication',       'communication'),
  ('Productivité',        'productivite');

-- Courses are authored by the instructor account (users.id = 2).
INSERT INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description, content_type, content, price, is_published)
VALUES
  (2, 1,
   'Formation Complète Développeur Web',
   'formation-complete-developpeur-web',
   'De zéro à fullstack : HTML, CSS, JavaScript, PHP et MySQL',
   'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
   'Devenez développeur web fullstack en partant de zéro. Ce parcours couvre le balisage, la mise en page moderne, le JavaScript du navigateur, puis un back end PHP relié à MySQL. Chaque module se termine par un projet à rendre.',
   'text',
   'Module 1 — Le document HTML : structure, sémantique, accessibilité.\nModule 2 — CSS moderne : flexbox, grid, design responsive.\nModule 3 — JavaScript : types, fonctions, DOM, fetch.\nModule 4 — PHP et MySQL : requêtes préparées, sessions, sécurité.\nModule 5 — Projet final : une application complète déployée.',
   0.00, 1),

  (2, 2,
   'Marketing Digital : de zéro à expert',
   'marketing-digital-de-zero-a-expert',
   'Construire, mesurer et optimiser des campagnes qui convertissent',
   'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=1200&q=80',
   'Maîtrisez les fondamentaux du marketing digital : positionnement, acquisition, référencement naturel et payant, et surtout la mesure. Vous repartez avec un tableau de bord d''analyse réutilisable.',
   'text',
   'Chapitre 1 — Le paysage du marketing digital.\nChapitre 2 — SEO fondamental : intention de recherche et contenu.\nChapitre 3 — Publicité payante : structure de campagne et budget.\nChapitre 4 — Analytics : définir et suivre les bons indicateurs.',
   0.00, 1),

  (2, 3,
   'Maîtrisez Photoshop',
   'maitrisez-photoshop',
   'Du calque de base à la retouche professionnelle',
   'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
   'Formation complète sur Adobe Photoshop. On part de l''interface et des calques, puis on va jusqu''aux masques, aux objets dynamiques et à un flux de retouche non destructif.',
   'video',
   'Partie 1 — Interface, calques et outils de sélection.\nPartie 2 — Masques et retouche non destructive.\nPartie 3 — Objets dynamiques et automatisation.\nPartie 4 — Export pour le web et pour l''impression.',
   0.00, 1),

  (2, 1,
   'WordPress pour les entrepreneurs',
   'wordpress-pour-les-entrepreneurs',
   'Un site professionnel en ligne sans écrire une ligne de code',
   'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
   'Créez et gérez votre site professionnel avec WordPress. Installation, thème, pages essentielles, formulaire de contact, référencement de base et sauvegardes.',
   'text',
   'Section 1 — Installation et choix de l''hébergement.\nSection 2 — Thèmes et personnalisation.\nSection 3 — Pages essentielles et formulaires.\nSection 4 — Référencement, sauvegardes et sécurité.',
   0.00, 1),

  (2, 4,
   'Anglais des affaires',
   'anglais-des-affaires',
   'Réunions, e-mails et négociation en anglais professionnel',
   'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
   'Améliorez votre anglais professionnel : vocabulaire des réunions, rédaction d''e-mails clairs, présentation d''un projet et conduite d''une négociation.',
   'text',
   'Leçon 1 — Vocabulaire professionnel de base.\nLeçon 2 — Conduire et suivre une réunion.\nLeçon 3 — Rédiger des e-mails efficaces.\nLeçon 4 — Présenter et négocier.',
   0.00, 1),

  (2, 5,
   'Création d''entreprise de A à Z',
   'creation-d-entreprise-de-a-a-z',
   'De l''étude de marché aux premiers clients',
   'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
   'Guide complet pour lancer votre entreprise : valider le besoin, choisir un statut, construire un business plan crédible et aller chercher les premiers clients.',
   'text',
   'Module 1 — Étude de marché et validation.\nModule 2 — Statut juridique et formalités.\nModule 3 — Business plan et prévisionnel.\nModule 4 — Acquisition des premiers clients.',
   0.00, 1),

  (2, 6,
   'Concevoir des interfaces claires',
   'concevoir-des-interfaces-claires',
   'Principes de mise en page, typographie et hiérarchie visuelle',
   'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=1200&q=80',
   'Un cours court et pratique sur ce qui rend une interface lisible : grille, échelle typographique, contraste, espacement et états d''interaction.',
   'text',
   'Leçon 1 — La grille et le rythme vertical.\nLeçon 2 — Échelle typographique et hiérarchie.\nLeçon 3 — Contraste et accessibilité.\nLeçon 4 — États, retours et micro-interactions.',
   0.00, 0);

INSERT INTO course_tags (course_id, tag_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 9),
  (2, 4), (2, 6), (2, 11),
  (3, 5), (3, 8), (3, 10),
  (4, 7), (4, 12), (4, 9),
  (5, 14), (5, 9),
  (6, 13), (6, 12),
  (7, 8), (7, 9), (7, 14);

INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES
  (3, 1, '2026-06-14 09:12:00'),
  (3, 2, '2026-07-02 18:40:00'),
  (3, 5, '2026-08-05 11:05:00');
