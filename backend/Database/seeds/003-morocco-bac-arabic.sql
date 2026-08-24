-- ---------------------------------------------------------------------------
-- المنهاج المغربي — الثانية باكالوريا، بالعربية
-- Moroccan baccalaureate curriculum (2 Bac), in Arabic.
--
-- Structure and lesson titles were read off AlloSchool's course pages, which
-- follow the Ministry's official programme. The programme itself is public
-- curriculum; what is stored here is the outline plus a link back. No lesson
-- text, exercise or document is copied.
--
-- AlloSchool's written material is free to read; its VIDEO lessons are behind
-- a Premium subscription, so lessons link to the course page rather than
-- promise a free video. The free AlloSchool YouTube channel is linked too.
--
-- Companion to 002-open-courseware.sql (MIT/Yale, English). This one is the
-- Arabic, Moroccan half — which is the language the platform now defaults to.
--
-- Re-runnable: keyed on unique slugs, guarded by NOT EXISTS.
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;

USE youlearn;

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Mathematics', 'mathematics'),
  ('Physics', 'physics'),
  ('Philosophy', 'philosophy'),
  ('Life & Earth Sciences', 'life-earth-sciences');

INSERT IGNORE INTO tags (title, slug) VALUES
  ('الثانية باكالوريا', '2-bac'),
  ('علوم فيزيائية', 'sciences-physiques'),
  ('المنهاج المغربي', 'moroccan-curriculum'),
  ('اللغة العربية', 'arabic-language'),
  ('رياضيات', 'riadhiat'),
  ('فيزياء وكيمياء', 'physique-chimie'),
  ('فلسفة', 'philosophie'),
  ('علوم الحياة والأرض', 'svt');

-- The same curator account 002 uses. Created there; repeated here so this
-- file can be applied on its own.
INSERT IGNORE INTO users (keycloak_id, name, email, role, is_active) VALUES
  ('44444444-4444-4444-8444-444444444444', 'YouLearn Open Library', 'library@youlearn.local', 'enseignant', 1);

-- --------------------------------------------------------------------------
-- الرياضيات — الثانية باكالوريا علوم فيزيائية
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, cat.id, 'الرياضيات — الثانية باكالوريا علوم فيزيائية', 'ma-2bac-sp-mathematiques',
       'المقرر الرسمي كاملا: النهايات والاتصال، الاشتقاق، المتتاليات، الأعداد العقدية، الحساب التكاملي والاحتمالات',
       'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=1200&q=80',
       'برنامج الرياضيات للسنة الثانية من سلك البكالوريا، شعبة العلوم الفيزيائية، مرتبا حسب المقرر الرسمي.

ستة عشر محورا، من النهايات والاتصال إلى حساب الاحتمالات، وكل محور مقسم إلى دروس متتابعة كما هي في المنهاج. الدروس والتمارين متاحة مجانا على آلوسكول.',
       'text', 'برنامج الرياضيات للسنة الثانية من سلك البكالوريا، شعبة العلوم الفيزيائية، مرتبا حسب المقرر الرسمي.

ستة عشر محورا، من النهايات والاتصال إلى حساب الاحتمالات، وكل محور مقسم إلى دروس متتابعة كما هي في المنهاج. الدروس والتمارين متاحة مجانا على آلوسكول.

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
صفحة الدرس: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia
قناة آلوسكول على يوتيوب (مجانية): https://www.youtube.com/channel/UCikh5nvI5z5AHmtsYq2XwBQ

ملاحظة: الوثائق مجانية على آلوسكول، أما دروس الفيديو فتتطلب اشتراك Premium.', 0.00, 1
  FROM users u, categories cat
 WHERE u.email = 'library@youlearn.local' AND cat.slug = 'mathematics';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND t.slug = '2-bac';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND t.slug = 'sciences-physiques';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND t.slug = 'moroccan-curriculum';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND t.slug = 'riadhiat';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'النهايات والاتصال', NULL, 0 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'النهايات والاتصال'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'النهايات والاتصال', 'text', 'النهايات والاتصال

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'النهايات والاتصال'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'النهايات والاتصال', 'text', 'النهايات والاتصال

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'النهايات والاتصال'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'النهايات والاتصال', 'text', 'النهايات والاتصال

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'النهايات والاتصال'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'النهايات والاتصال', 'text', 'النهايات والاتصال

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'النهايات والاتصال'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الاشتقاق', NULL, 1 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الاشتقاق'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الاشتقاق', 'text', 'الاشتقاق

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الاشتقاق'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الاشتقاق', 'text', 'الاشتقاق

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الاشتقاق'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الاشتقاق', 'text', 'الاشتقاق

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الاشتقاق'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'الاشتقاق', 'text', 'الاشتقاق

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الاشتقاق'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'دراسة الدوال وتمثيلها المبياني', NULL, 2 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'دراسة الدوال وتمثيلها المبياني'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'دراسة الدوال وتمثيلها المبياني', 'text', 'دراسة الدوال وتمثيلها المبياني

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 8
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'دراسة الدوال وتمثيلها المبياني'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'دراسة الدوال وتمثيلها المبياني', 'text', 'دراسة الدوال وتمثيلها المبياني

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 9
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'دراسة الدوال وتمثيلها المبياني'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'دراسة الدوال وتمثيلها المبياني', 'text', 'دراسة الدوال وتمثيلها المبياني

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 10
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'دراسة الدوال وتمثيلها المبياني'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الدوال الأصلية', NULL, 3 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الدوال الأصلية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الدوال الأصلية', 'text', 'الدوال الأصلية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 11
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال الأصلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الدوال الأصلية', 'text', 'الدوال الأصلية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 12
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال الأصلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الدوال الأصلية', 'text', 'الدوال الأصلية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 13
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال الأصلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'المتتاليات العددية', NULL, 4 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'المتتاليات العددية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'المتتاليات العددية', 'text', 'المتتاليات العددية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 14
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'المتتاليات العددية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'المتتاليات العددية', 'text', 'المتتاليات العددية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 15
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'المتتاليات العددية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'المتتاليات العددية', 'text', 'المتتاليات العددية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 16
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'المتتاليات العددية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الدوال اللوغاريتمية', NULL, 5 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الدوال اللوغاريتمية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الدوال اللوغاريتمية', 'text', 'الدوال اللوغاريتمية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 17
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال اللوغاريتمية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الدوال اللوغاريتمية', 'text', 'الدوال اللوغاريتمية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 18
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال اللوغاريتمية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الدوال اللوغاريتمية', 'text', 'الدوال اللوغاريتمية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 19
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال اللوغاريتمية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الأعداد العقدية 1', NULL, 6 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الأعداد العقدية 1'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الأعداد العقدية 1', 'text', 'الأعداد العقدية 1

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 20
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الأعداد العقدية 1'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الأعداد العقدية 1', 'text', 'الأعداد العقدية 1

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 21
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الأعداد العقدية 1'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الدوال الأسية', NULL, 7 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الدوال الأسية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الدوال الأسية', 'text', 'الدوال الأسية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 22
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال الأسية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الدوال الأسية', 'text', 'الدوال الأسية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 23
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال الأسية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الدوال الأسية', 'text', 'الدوال الأسية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 24
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الدوال الأسية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الأعداد العقدية 2', NULL, 8 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الأعداد العقدية 2'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الأعداد العقدية 2', 'text', 'الأعداد العقدية 2

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 25
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الأعداد العقدية 2'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الأعداد العقدية 2', 'text', 'الأعداد العقدية 2

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 26
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الأعداد العقدية 2'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الأعداد العقدية 2', 'text', 'الأعداد العقدية 2

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 27
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الأعداد العقدية 2'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'الأعداد العقدية 2', 'text', 'الأعداد العقدية 2

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 28
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الأعداد العقدية 2'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'المعادلات التفاضلية', NULL, 9 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'المعادلات التفاضلية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'المعادلات التفاضلية', 'text', 'المعادلات التفاضلية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 29
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'المعادلات التفاضلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'المعادلات التفاضلية', 'text', 'المعادلات التفاضلية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 30
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'المعادلات التفاضلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'المعادلات التفاضلية', 'text', 'المعادلات التفاضلية

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 31
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'المعادلات التفاضلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الحساب التكاملي', NULL, 10 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الحساب التكاملي'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الحساب التكاملي', 'text', 'الحساب التكاملي

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 32
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الحساب التكاملي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الحساب التكاملي', 'text', 'الحساب التكاملي

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 33
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الحساب التكاملي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الحساب التكاملي', 'text', 'الحساب التكاملي

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 34
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الحساب التكاملي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الجداء السلمي في الفضاء', NULL, 11 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الجداء السلمي في الفضاء'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الجداء السلمي في الفضاء', 'text', 'الجداء السلمي في الفضاء

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 35
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الجداء السلمي في الفضاء'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الجداء السلمي في الفضاء', 'text', 'الجداء السلمي في الفضاء

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 36
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الجداء السلمي في الفضاء'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الجداء المتجهي', NULL, 12 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الجداء المتجهي'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الجداء المتجهي', 'text', 'الجداء المتجهي

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 37
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الجداء المتجهي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الجداء المتجهي', 'text', 'الجداء المتجهي

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 38
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الجداء المتجهي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الفلكة', NULL, 13 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الفلكة'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الفلكة', 'text', 'الفلكة

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 39
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الفلكة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الفلكة', 'text', 'الفلكة

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 40
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'الفلكة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'التعداد', NULL, 14 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'التعداد'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'التعداد', 'text', 'التعداد

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 41
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'التعداد'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'حساب الاحتمالات', NULL, 15 FROM courses co WHERE co.slug = 'ma-2bac-sp-mathematiques'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'حساب الاحتمالات'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'حساب الاحتمالات', 'text', 'حساب الاحتمالات

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 42
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'حساب الاحتمالات'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'حساب الاحتمالات', 'text', 'حساب الاحتمالات

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 43
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'حساب الاحتمالات'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'حساب الاحتمالات', 'text', 'حساب الاحتمالات

المصدر: آلوسكول — الرياضيات: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alriadhiat-althania-bak-alom-fiziaiia', 0, 0, 44
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-mathematiques' AND s.title = 'حساب الاحتمالات'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

-- --------------------------------------------------------------------------
-- الفيزياء والكيمياء — الثانية باكالوريا علوم فيزيائية
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, cat.id, 'الفيزياء والكيمياء — الثانية باكالوريا علوم فيزيائية', 'ma-2bac-sp-physique-chimie',
       'الموجات، التحولات النووية، الكهرباء، التحولات الكيميائية وقوانين نيوتن',
       'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80',
       'المقرر الكامل للفيزياء والكيمياء في الثانية باكالوريا علوم فيزيائية: واحد وعشرون محورا وأكثر من مائة درس.

يبدأ بالموجات الميكانيكية والضوئية، ثم التحولات النووية، فالدارات الكهربائية RC وRL وRLC، ثم التحولات الكيميائية وتطورها الزمني، وينتهي بقوانين نيوتن وتطبيقاتها.',
       'text', 'المقرر الكامل للفيزياء والكيمياء في الثانية باكالوريا علوم فيزيائية: واحد وعشرون محورا وأكثر من مائة درس.

يبدأ بالموجات الميكانيكية والضوئية، ثم التحولات النووية، فالدارات الكهربائية RC وRL وRLC، ثم التحولات الكيميائية وتطورها الزمني، وينتهي بقوانين نيوتن وتطبيقاتها.

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
صفحة الدرس: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia
قناة آلوسكول على يوتيوب (مجانية): https://www.youtube.com/channel/UCikh5nvI5z5AHmtsYq2XwBQ

ملاحظة: الوثائق مجانية على آلوسكول، أما دروس الفيديو فتتطلب اشتراك Premium.', 0.00, 1
  FROM users u, categories cat
 WHERE u.email = 'library@youlearn.local' AND cat.slug = 'physics';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND t.slug = '2-bac';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND t.slug = 'sciences-physiques';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND t.slug = 'moroccan-curriculum';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND t.slug = 'physique-chimie';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الموجات الميكانيكية المتوالية', NULL, 0 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الموجات الميكانيكية المتوالية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الموجات الميكانيكية المتوالية', 'text', 'الموجات الميكانيكية المتوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الموجات الميكانيكية المتوالية', 'text', 'الموجات الميكانيكية المتوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الموجات الميكانيكية المتوالية', 'text', 'الموجات الميكانيكية المتوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'الموجات الميكانيكية المتوالية', 'text', 'الموجات الميكانيكية المتوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'الموجات الميكانيكية المتوالية', 'text', 'الموجات الميكانيكية المتوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'الموجات الميكانيكية المتوالية', 'text', 'الموجات الميكانيكية المتوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'الموجات الميكانيكية المتوالية', 'text', 'الموجات الميكانيكية المتوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 8', 'الموجات الميكانيكية المتوالية', 'text', 'الموجات الميكانيكية المتوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 8');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الموجات الميكانيكية المتوالية الدورية', NULL, 1 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الموجات الميكانيكية المتوالية الدورية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الموجات الميكانيكية المتوالية الدورية', 'text', 'الموجات الميكانيكية المتوالية الدورية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 8
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية الدورية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الموجات الميكانيكية المتوالية الدورية', 'text', 'الموجات الميكانيكية المتوالية الدورية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 9
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية الدورية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الموجات الميكانيكية المتوالية الدورية', 'text', 'الموجات الميكانيكية المتوالية الدورية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 10
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية الدورية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'الموجات الميكانيكية المتوالية الدورية', 'text', 'الموجات الميكانيكية المتوالية الدورية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 11
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية الدورية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'الموجات الميكانيكية المتوالية الدورية', 'text', 'الموجات الميكانيكية المتوالية الدورية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 12
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية الدورية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'الموجات الميكانيكية المتوالية الدورية', 'text', 'الموجات الميكانيكية المتوالية الدورية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 13
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية الدورية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'الموجات الميكانيكية المتوالية الدورية', 'text', 'الموجات الميكانيكية المتوالية الدورية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 14
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية الدورية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 8', 'الموجات الميكانيكية المتوالية الدورية', 'text', 'الموجات الميكانيكية المتوالية الدورية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 15
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الميكانيكية المتوالية الدورية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 8');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'انتشار موجة ضوئية', NULL, 2 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'انتشار موجة ضوئية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'انتشار موجة ضوئية', 'text', 'انتشار موجة ضوئية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 16
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'انتشار موجة ضوئية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'انتشار موجة ضوئية', 'text', 'انتشار موجة ضوئية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 17
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'انتشار موجة ضوئية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'انتشار موجة ضوئية', 'text', 'انتشار موجة ضوئية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 18
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'انتشار موجة ضوئية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'انتشار موجة ضوئية', 'text', 'انتشار موجة ضوئية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 19
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'انتشار موجة ضوئية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'انتشار موجة ضوئية', 'text', 'انتشار موجة ضوئية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 20
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'انتشار موجة ضوئية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'انتشار موجة ضوئية', 'text', 'انتشار موجة ضوئية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 21
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'انتشار موجة ضوئية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'انتشار موجة ضوئية', 'text', 'انتشار موجة ضوئية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 22
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'انتشار موجة ضوئية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 8', 'انتشار موجة ضوئية', 'text', 'انتشار موجة ضوئية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 23
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'انتشار موجة ضوئية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 8');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'حيود الضوء بواسطة شبكة', NULL, 3 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'حيود الضوء بواسطة شبكة'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'حيود الضوء بواسطة شبكة', 'text', 'حيود الضوء بواسطة شبكة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 24
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حيود الضوء بواسطة شبكة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'حيود الضوء بواسطة شبكة', 'text', 'حيود الضوء بواسطة شبكة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 25
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حيود الضوء بواسطة شبكة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'التناقص الإشعاعي', NULL, 4 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'التناقص الإشعاعي'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'التناقص الإشعاعي', 'text', 'التناقص الإشعاعي

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 26
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التناقص الإشعاعي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'التناقص الإشعاعي', 'text', 'التناقص الإشعاعي

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 27
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التناقص الإشعاعي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'التناقص الإشعاعي', 'text', 'التناقص الإشعاعي

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 28
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التناقص الإشعاعي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'التناقص الإشعاعي', 'text', 'التناقص الإشعاعي

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 29
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التناقص الإشعاعي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'التناقص الإشعاعي', 'text', 'التناقص الإشعاعي

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 30
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التناقص الإشعاعي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'التناقص الإشعاعي', 'text', 'التناقص الإشعاعي

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 31
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التناقص الإشعاعي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'التناقص الإشعاعي', 'text', 'التناقص الإشعاعي

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 32
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التناقص الإشعاعي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 8', 'التناقص الإشعاعي', 'text', 'التناقص الإشعاعي

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 33
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التناقص الإشعاعي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 8');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'النوى والكتلة والطاقة', NULL, 5 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'النوى والكتلة والطاقة'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'النوى والكتلة والطاقة', 'text', 'النوى والكتلة والطاقة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 34
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'النوى والكتلة والطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'النوى والكتلة والطاقة', 'text', 'النوى والكتلة والطاقة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 35
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'النوى والكتلة والطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'النوى والكتلة والطاقة', 'text', 'النوى والكتلة والطاقة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 36
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'النوى والكتلة والطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'النوى والكتلة والطاقة', 'text', 'النوى والكتلة والطاقة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 37
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'النوى والكتلة والطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'النوى والكتلة والطاقة', 'text', 'النوى والكتلة والطاقة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 38
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'النوى والكتلة والطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'النوى والكتلة والطاقة', 'text', 'النوى والكتلة والطاقة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 39
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'النوى والكتلة والطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'النوى والكتلة والطاقة', 'text', 'النوى والكتلة والطاقة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 40
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'النوى والكتلة والطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 8', 'النوى والكتلة والطاقة', 'text', 'النوى والكتلة والطاقة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 41
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'النوى والكتلة والطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 8');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'ثنائي القطب RC', NULL, 6 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'ثنائي القطب RC'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'ثنائي القطب RC', 'text', 'ثنائي القطب RC

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 42
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RC'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'ثنائي القطب RC', 'text', 'ثنائي القطب RC

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 43
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RC'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'ثنائي القطب RC', 'text', 'ثنائي القطب RC

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 44
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RC'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'ثنائي القطب RC', 'text', 'ثنائي القطب RC

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 45
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RC'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'ثنائي القطب RC', 'text', 'ثنائي القطب RC

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 46
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RC'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'ثنائي القطب RC', 'text', 'ثنائي القطب RC

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 47
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RC'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'ثنائي القطب RC', 'text', 'ثنائي القطب RC

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 48
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RC'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 8', 'ثنائي القطب RC', 'text', 'ثنائي القطب RC

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 49
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RC'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 8');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'ثنائي القطب RL', NULL, 7 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'ثنائي القطب RL'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'ثنائي القطب RL', 'text', 'ثنائي القطب RL

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 50
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RL'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'ثنائي القطب RL', 'text', 'ثنائي القطب RL

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 51
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RL'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'ثنائي القطب RL', 'text', 'ثنائي القطب RL

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 52
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RL'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'ثنائي القطب RL', 'text', 'ثنائي القطب RL

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 53
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RL'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'ثنائي القطب RL', 'text', 'ثنائي القطب RL

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 54
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RL'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'ثنائي القطب RL', 'text', 'ثنائي القطب RL

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 55
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RL'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'ثنائي القطب RL', 'text', 'ثنائي القطب RL

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 56
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'ثنائي القطب RL'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'التذبذبات الحرة في دارة RLC متوالية', NULL, 8 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'التذبذبات الحرة في دارة RLC متوالية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'التذبذبات الحرة في دارة RLC متوالية', 'text', 'التذبذبات الحرة في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 57
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات الحرة في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'التذبذبات الحرة في دارة RLC متوالية', 'text', 'التذبذبات الحرة في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 58
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات الحرة في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'التذبذبات الحرة في دارة RLC متوالية', 'text', 'التذبذبات الحرة في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 59
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات الحرة في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'التذبذبات الحرة في دارة RLC متوالية', 'text', 'التذبذبات الحرة في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 60
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات الحرة في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'التذبذبات الحرة في دارة RLC متوالية', 'text', 'التذبذبات الحرة في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 61
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات الحرة في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'التذبذبات الحرة في دارة RLC متوالية', 'text', 'التذبذبات الحرة في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 62
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات الحرة في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'التذبذبات الحرة في دارة RLC متوالية', 'text', 'التذبذبات الحرة في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 63
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات الحرة في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'التذبذبات القسرية في دارة RLC متوالية', NULL, 9 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'التذبذبات القسرية في دارة RLC متوالية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'التذبذبات القسرية في دارة RLC متوالية', 'text', 'التذبذبات القسرية في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 64
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات القسرية في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'التذبذبات القسرية في دارة RLC متوالية', 'text', 'التذبذبات القسرية في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 65
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات القسرية في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'التذبذبات القسرية في دارة RLC متوالية', 'text', 'التذبذبات القسرية في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 66
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات القسرية في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'التذبذبات القسرية في دارة RLC متوالية', 'text', 'التذبذبات القسرية في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 67
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات القسرية في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'التذبذبات القسرية في دارة RLC متوالية', 'text', 'التذبذبات القسرية في دارة RLC متوالية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 68
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التذبذبات القسرية في دارة RLC متوالية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'التحولات السريعة والتحولات البطيئة', NULL, 10 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'التحولات السريعة والتحولات البطيئة'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'التحولات السريعة والتحولات البطيئة', 'text', 'التحولات السريعة والتحولات البطيئة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 69
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات السريعة والتحولات البطيئة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'التحولات السريعة والتحولات البطيئة', 'text', 'التحولات السريعة والتحولات البطيئة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 70
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات السريعة والتحولات البطيئة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'التحولات السريعة والتحولات البطيئة', 'text', 'التحولات السريعة والتحولات البطيئة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 71
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات السريعة والتحولات البطيئة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'التحولات السريعة والتحولات البطيئة', 'text', 'التحولات السريعة والتحولات البطيئة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 72
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات السريعة والتحولات البطيئة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'التحولات السريعة والتحولات البطيئة', 'text', 'التحولات السريعة والتحولات البطيئة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 73
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات السريعة والتحولات البطيئة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'التحولات السريعة والتحولات البطيئة', 'text', 'التحولات السريعة والتحولات البطيئة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 74
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات السريعة والتحولات البطيئة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'التتبع الزمني لتحول كيميائي — سرعة التفاعل', NULL, 11 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'التتبع الزمني لتحول كيميائي — سرعة التفاعل'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل', 'text', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 75
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التتبع الزمني لتحول كيميائي — سرعة التفاعل'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل', 'text', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 76
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التتبع الزمني لتحول كيميائي — سرعة التفاعل'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل', 'text', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 77
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التتبع الزمني لتحول كيميائي — سرعة التفاعل'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل', 'text', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 78
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التتبع الزمني لتحول كيميائي — سرعة التفاعل'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل', 'text', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 79
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التتبع الزمني لتحول كيميائي — سرعة التفاعل'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل', 'text', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 80
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التتبع الزمني لتحول كيميائي — سرعة التفاعل'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل', 'text', 'التتبع الزمني لتحول كيميائي — سرعة التفاعل

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 81
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التتبع الزمني لتحول كيميائي — سرعة التفاعل'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'التحولات الكيميائية التي تحدث في منحيين', NULL, 12 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'التحولات الكيميائية التي تحدث في منحيين'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'التحولات الكيميائية التي تحدث في منحيين', 'text', 'التحولات الكيميائية التي تحدث في منحيين

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 82
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية التي تحدث في منحيين'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'التحولات الكيميائية التي تحدث في منحيين', 'text', 'التحولات الكيميائية التي تحدث في منحيين

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 83
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية التي تحدث في منحيين'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'التحولات الكيميائية التي تحدث في منحيين', 'text', 'التحولات الكيميائية التي تحدث في منحيين

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 84
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية التي تحدث في منحيين'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'التحولات الكيميائية التي تحدث في منحيين', 'text', 'التحولات الكيميائية التي تحدث في منحيين

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 85
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية التي تحدث في منحيين'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'التحولات الكيميائية التي تحدث في منحيين', 'text', 'التحولات الكيميائية التي تحدث في منحيين

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 86
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية التي تحدث في منحيين'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'التحولات الكيميائية التي تحدث في منحيين', 'text', 'التحولات الكيميائية التي تحدث في منحيين

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 87
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية التي تحدث في منحيين'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'حالة توازن مجموعة كيميائية', NULL, 13 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'حالة توازن مجموعة كيميائية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'حالة توازن مجموعة كيميائية', 'text', 'حالة توازن مجموعة كيميائية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 88
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حالة توازن مجموعة كيميائية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'حالة توازن مجموعة كيميائية', 'text', 'حالة توازن مجموعة كيميائية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 89
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حالة توازن مجموعة كيميائية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'حالة توازن مجموعة كيميائية', 'text', 'حالة توازن مجموعة كيميائية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 90
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حالة توازن مجموعة كيميائية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'حالة توازن مجموعة كيميائية', 'text', 'حالة توازن مجموعة كيميائية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 91
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حالة توازن مجموعة كيميائية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'حالة توازن مجموعة كيميائية', 'text', 'حالة توازن مجموعة كيميائية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 92
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حالة توازن مجموعة كيميائية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'حالة توازن مجموعة كيميائية', 'text', 'حالة توازن مجموعة كيميائية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 93
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حالة توازن مجموعة كيميائية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'حالة توازن مجموعة كيميائية', 'text', 'حالة توازن مجموعة كيميائية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 94
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'حالة توازن مجموعة كيميائية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة', NULL, 14 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة', 'text', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 95
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة', 'text', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 96
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة', 'text', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 97
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة', 'text', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 98
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة', 'text', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 99
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة', 'text', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 100
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة', 'text', 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 101
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'التحولات الكيميائية المقرونة بالتفاعلات حمض — قاعدة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'المعايرة الحمضية القاعدية', NULL, 15 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'المعايرة الحمضية القاعدية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'المعايرة الحمضية القاعدية', 'text', 'المعايرة الحمضية القاعدية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 102
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'المعايرة الحمضية القاعدية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'المعايرة الحمضية القاعدية', 'text', 'المعايرة الحمضية القاعدية

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 103
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'المعايرة الحمضية القاعدية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الموجات الكهرمغنطيسية ونقل المعلومات', NULL, 16 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الموجات الكهرمغنطيسية ونقل المعلومات'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الموجات الكهرمغنطيسية ونقل المعلومات', 'text', 'الموجات الكهرمغنطيسية ونقل المعلومات

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 104
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الكهرمغنطيسية ونقل المعلومات'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الموجات الكهرمغنطيسية ونقل المعلومات', 'text', 'الموجات الكهرمغنطيسية ونقل المعلومات

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 105
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الكهرمغنطيسية ونقل المعلومات'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'الموجات الكهرمغنطيسية ونقل المعلومات', 'text', 'الموجات الكهرمغنطيسية ونقل المعلومات

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 106
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الكهرمغنطيسية ونقل المعلومات'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'الموجات الكهرمغنطيسية ونقل المعلومات', 'text', 'الموجات الكهرمغنطيسية ونقل المعلومات

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 107
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الكهرمغنطيسية ونقل المعلومات'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'تضمين الوسع', NULL, 17 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'تضمين الوسع'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'تضمين الوسع', 'text', 'تضمين الوسع

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 108
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'تضمين الوسع'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'تضمين الوسع', 'text', 'تضمين الوسع

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 109
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'تضمين الوسع'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'تضمين الوسع', 'text', 'تضمين الوسع

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 110
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'تضمين الوسع'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'تضمين الوسع', 'text', 'تضمين الوسع

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 111
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'تضمين الوسع'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'تضمين الوسع', 'text', 'تضمين الوسع

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 112
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'تضمين الوسع'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الموجات الكهرمغنطيسية ونقل المعلومات — تضمين الوسع', NULL, 18 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الموجات الكهرمغنطيسية ونقل المعلومات — تضمين الوسع'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'الموجات الكهرمغنطيسية ونقل المعلومات — تضمين الوسع', 'text', 'الموجات الكهرمغنطيسية ونقل المعلومات — تضمين الوسع

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 113
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الكهرمغنطيسية ونقل المعلومات — تضمين الوسع'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'الموجات الكهرمغنطيسية ونقل المعلومات — تضمين الوسع', 'text', 'الموجات الكهرمغنطيسية ونقل المعلومات — تضمين الوسع

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 114
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'الموجات الكهرمغنطيسية ونقل المعلومات — تضمين الوسع'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'قوانين نيوتن', NULL, 19 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'قوانين نيوتن'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'قوانين نيوتن', 'text', 'قوانين نيوتن

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 115
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'قوانين نيوتن'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'قوانين نيوتن', 'text', 'قوانين نيوتن

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 116
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'قوانين نيوتن'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'قوانين نيوتن', 'text', 'قوانين نيوتن

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 117
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'قوانين نيوتن'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'قوانين نيوتن', 'text', 'قوانين نيوتن

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 118
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'قوانين نيوتن'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'قوانين نيوتن', 'text', 'قوانين نيوتن

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 119
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'قوانين نيوتن'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'قوانين نيوتن', 'text', 'قوانين نيوتن

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 120
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'قوانين نيوتن'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'قوانين نيوتن', 'text', 'قوانين نيوتن

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 121
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'قوانين نيوتن'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 8', 'قوانين نيوتن', 'text', 'قوانين نيوتن

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 122
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'قوانين نيوتن'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 8');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'السقوط الرأسي لجسم صلب', NULL, 20 FROM courses co WHERE co.slug = 'ma-2bac-sp-physique-chimie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'السقوط الرأسي لجسم صلب'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 1', 'السقوط الرأسي لجسم صلب', 'text', 'السقوط الرأسي لجسم صلب

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 123
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'السقوط الرأسي لجسم صلب'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 1');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 2', 'السقوط الرأسي لجسم صلب', 'text', 'السقوط الرأسي لجسم صلب

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 124
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'السقوط الرأسي لجسم صلب'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 2');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 3', 'السقوط الرأسي لجسم صلب', 'text', 'السقوط الرأسي لجسم صلب

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 125
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'السقوط الرأسي لجسم صلب'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 3');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 4', 'السقوط الرأسي لجسم صلب', 'text', 'السقوط الرأسي لجسم صلب

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 126
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'السقوط الرأسي لجسم صلب'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 4');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 5', 'السقوط الرأسي لجسم صلب', 'text', 'السقوط الرأسي لجسم صلب

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 127
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'السقوط الرأسي لجسم صلب'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 5');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 6', 'السقوط الرأسي لجسم صلب', 'text', 'السقوط الرأسي لجسم صلب

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 128
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'السقوط الرأسي لجسم صلب'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 6');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدرس 7', 'السقوط الرأسي لجسم صلب', 'text', 'السقوط الرأسي لجسم صلب

المصدر: آلوسكول — الفيزياء والكيمياء: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alfiziaa-oalkimiaa-althania-bak-alom-fiziaiia', 0, 0, 129
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-physique-chimie' AND s.title = 'السقوط الرأسي لجسم صلب'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدرس 7');

-- --------------------------------------------------------------------------
-- الفلسفة — الثانية باكالوريا
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, cat.id, 'الفلسفة — الثانية باكالوريا', 'ma-2bac-philosophie',
       'المجزوءات الأربع: الوضع البشري، المعرفة، السياسة والأخلاق',
       'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
       'مفاهيم الفلسفة الثمانية المقررة في الثانية باكالوريا، موزعة على أربع مجزوءات.

الشخص والغير في الوضع البشري، والنظرية والتجربة والحقيقة في المعرفة، والدولة والحق والعدالة في السياسة، والواجب والحرية في الأخلاق.

لكل مفهوم مواقف فلسفية ومحاور للتحليل والمناقشة، إضافة إلى منهجية الكتابة الفلسفية التي يقوم عليها الامتحان الوطني.',
       'text', 'مفاهيم الفلسفة الثمانية المقررة في الثانية باكالوريا، موزعة على أربع مجزوءات.

الشخص والغير في الوضع البشري، والنظرية والتجربة والحقيقة في المعرفة، والدولة والحق والعدالة في السياسة، والواجب والحرية في الأخلاق.

لكل مفهوم مواقف فلسفية ومحاور للتحليل والمناقشة، إضافة إلى منهجية الكتابة الفلسفية التي يقوم عليها الامتحان الوطني.

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
صفحة الدرس: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia
قناة آلوسكول على يوتيوب (مجانية): https://www.youtube.com/channel/UCikh5nvI5z5AHmtsYq2XwBQ

ملاحظة: الوثائق مجانية على آلوسكول، أما دروس الفيديو فتتطلب اشتراك Premium.', 0.00, 1
  FROM users u, categories cat
 WHERE u.email = 'library@youlearn.local' AND cat.slug = 'philosophy';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-philosophie' AND t.slug = '2-bac';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-philosophie' AND t.slug = 'moroccan-curriculum';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-philosophie' AND t.slug = 'philosophie';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-philosophie' AND t.slug = 'arabic-language';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'مجزوءة الوضع البشري', NULL, 0 FROM courses co WHERE co.slug = 'ma-2bac-philosophie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'مجزوءة الوضع البشري'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الشخص', 'مجزوءة الوضع البشري', 'text', 'مجزوءة الوضع البشري

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-philosophie' AND s.title = 'مجزوءة الوضع البشري'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الشخص');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الغير', 'مجزوءة الوضع البشري', 'text', 'مجزوءة الوضع البشري

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-philosophie' AND s.title = 'مجزوءة الوضع البشري'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الغير');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'مجزوءة المعرفة', NULL, 1 FROM courses co WHERE co.slug = 'ma-2bac-philosophie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'مجزوءة المعرفة'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'النظرية والتجربة', 'مجزوءة المعرفة', 'text', 'مجزوءة المعرفة

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-philosophie' AND s.title = 'مجزوءة المعرفة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'النظرية والتجربة');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الحقيقة', 'مجزوءة المعرفة', 'text', 'مجزوءة المعرفة

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-philosophie' AND s.title = 'مجزوءة المعرفة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الحقيقة');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'مجزوءة السياسة', NULL, 2 FROM courses co WHERE co.slug = 'ma-2bac-philosophie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'مجزوءة السياسة'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الدولة', 'مجزوءة السياسة', 'text', 'مجزوءة السياسة

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-philosophie' AND s.title = 'مجزوءة السياسة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الدولة');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الحق والعدالة', 'مجزوءة السياسة', 'text', 'مجزوءة السياسة

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-philosophie' AND s.title = 'مجزوءة السياسة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الحق والعدالة');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'مجزوءة الأخلاق', NULL, 3 FROM courses co WHERE co.slug = 'ma-2bac-philosophie'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'مجزوءة الأخلاق'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الواجب', 'مجزوءة الأخلاق', 'text', 'مجزوءة الأخلاق

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-philosophie' AND s.title = 'مجزوءة الأخلاق'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الواجب');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الحرية', 'مجزوءة الأخلاق', 'text', 'مجزوءة الأخلاق

المصدر: آلوسكول — الفلسفة: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alflsfa-althania-bak-alom-fiziaiia', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-philosophie' AND s.title = 'مجزوءة الأخلاق'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الحرية');

-- --------------------------------------------------------------------------
-- علوم الحياة والأرض — الثانية باكالوريا علوم فيزيائية
-- --------------------------------------------------------------------------
INSERT IGNORE INTO courses
  (instructor_id, category_id, title, slug, subtitle, img, description,
   content_type, content, price, is_published)
SELECT u.id, cat.id, 'علوم الحياة والأرض — الثانية باكالوريا علوم فيزيائية', 'ma-2bac-sp-svt',
       'الطاقة والمادة العضوية، الخبر الوراثي، والظواهر الجيولوجية',
       'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
       'برنامج علوم الحياة والأرض للثانية باكالوريا علوم فيزيائية، في خمس وحدات.

من استهلاك المادة العضوية وتدفق الطاقة، إلى طبيعة الخبر الوراثي وآلية تعبيره وانتقاله عبر التوالد الجنسي، ثم استعمال المواد ومراقبة جودة الأوساط الطبيعية، وأخيرا الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية.',
       'text', 'برنامج علوم الحياة والأرض للثانية باكالوريا علوم فيزيائية، في خمس وحدات.

من استهلاك المادة العضوية وتدفق الطاقة، إلى طبيعة الخبر الوراثي وآلية تعبيره وانتقاله عبر التوالد الجنسي، ثم استعمال المواد ومراقبة جودة الأوساط الطبيعية، وأخيرا الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية.

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
صفحة الدرس: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia
قناة آلوسكول على يوتيوب (مجانية): https://www.youtube.com/channel/UCikh5nvI5z5AHmtsYq2XwBQ

ملاحظة: الوثائق مجانية على آلوسكول، أما دروس الفيديو فتتطلب اشتراك Premium.', 0.00, 1
  FROM users u, categories cat
 WHERE u.email = 'library@youlearn.local' AND cat.slug = 'life-earth-sciences';

INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-svt' AND t.slug = '2-bac';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-svt' AND t.slug = 'sciences-physiques';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-svt' AND t.slug = 'moroccan-curriculum';
INSERT IGNORE INTO course_tags (course_id, tag_id)
SELECT co.id, t.id FROM courses co, tags t
 WHERE co.slug = 'ma-2bac-sp-svt' AND t.slug = 'svt';

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'استهلاك المادة العضوية وتدفق الطاقة', NULL, 0 FROM courses co WHERE co.slug = 'ma-2bac-sp-svt'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'استهلاك المادة العضوية وتدفق الطاقة'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'التفاعلات المسؤولة عن تحرير الطاقة الكامنة في المادة العضوية', 'استهلاك المادة العضوية وتدفق الطاقة', 'text', 'استهلاك المادة العضوية وتدفق الطاقة

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 1, 0
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'استهلاك المادة العضوية وتدفق الطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'التفاعلات المسؤولة عن تحرير الطاقة الكامنة في المادة العضوية');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'دور العضلة المخططة الهيكلية في تحويل الطاقة', 'استهلاك المادة العضوية وتدفق الطاقة', 'text', 'استهلاك المادة العضوية وتدفق الطاقة

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 1
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'استهلاك المادة العضوية وتدفق الطاقة'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'دور العضلة المخططة الهيكلية في تحويل الطاقة');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'طبيعة الخبر الوراثي وآلية تعبيره', NULL, 1 FROM courses co WHERE co.slug = 'ma-2bac-sp-svt'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'طبيعة الخبر الوراثي وآلية تعبيره'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'مفهوم الخبر الوراثي', 'طبيعة الخبر الوراثي وآلية تعبيره', 'text', 'طبيعة الخبر الوراثي وآلية تعبيره

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 2
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'طبيعة الخبر الوراثي وآلية تعبيره'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'مفهوم الخبر الوراثي');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'آلية تعبير الخبر الوراثي', 'طبيعة الخبر الوراثي وآلية تعبيره', 'text', 'طبيعة الخبر الوراثي وآلية تعبيره

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 3
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'طبيعة الخبر الوراثي وآلية تعبيره'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'آلية تعبير الخبر الوراثي');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'نقل الخبر الوراثي عبر التوالد الجنسي', NULL, 2 FROM courses co WHERE co.slug = 'ma-2bac-sp-svt'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'نقل الخبر الوراثي عبر التوالد الجنسي'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'نقل الخبر الوراثي عبر التوالد الجنسي', 'نقل الخبر الوراثي عبر التوالد الجنسي', 'text', 'نقل الخبر الوراثي عبر التوالد الجنسي

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 4
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'نقل الخبر الوراثي عبر التوالد الجنسي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'نقل الخبر الوراثي عبر التوالد الجنسي');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'القوانين الإحصائية لانتقال الصفات الوراثية عند ثنائيات الصيغة الصبغية', 'نقل الخبر الوراثي عبر التوالد الجنسي', 'text', 'نقل الخبر الوراثي عبر التوالد الجنسي

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 5
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'نقل الخبر الوراثي عبر التوالد الجنسي'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'القوانين الإحصائية لانتقال الصفات الوراثية عند ثنائيات الصيغة الصبغية');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'استعمال المواد العضوية وغير العضوية', NULL, 3 FROM courses co WHERE co.slug = 'ma-2bac-sp-svt'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'استعمال المواد العضوية وغير العضوية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'النفايات المنزلية الناتجة عن استعمال المواد العضوية', 'استعمال المواد العضوية وغير العضوية', 'text', 'استعمال المواد العضوية وغير العضوية

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 6
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'استعمال المواد العضوية وغير العضوية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'النفايات المنزلية الناتجة عن استعمال المواد العضوية');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'التلوثات الناتجة عن استهلاك المواد الطاقية واستعمال المواد العضوية', 'استعمال المواد العضوية وغير العضوية', 'text', 'استعمال المواد العضوية وغير العضوية

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 7
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'استعمال المواد العضوية وغير العضوية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'التلوثات الناتجة عن استهلاك المواد الطاقية واستعمال المواد العضوية');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'المواد المشعة والطاقة النووية', 'استعمال المواد العضوية وغير العضوية', 'text', 'استعمال المواد العضوية وغير العضوية

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 8
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'استعمال المواد العضوية وغير العضوية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'المواد المشعة والطاقة النووية');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'مراقبة جودة وصحة الأوساط الطبيعية', 'استعمال المواد العضوية وغير العضوية', 'text', 'استعمال المواد العضوية وغير العضوية

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 9
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'استعمال المواد العضوية وغير العضوية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'مراقبة جودة وصحة الأوساط الطبيعية');

INSERT INTO course_sections (course_id, title, summary, position)
SELECT co.id, 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية', NULL, 4 FROM courses co WHERE co.slug = 'ma-2bac-sp-svt'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1) x WHERE EXISTS (
        SELECT 1 FROM course_sections s
         WHERE s.course_id = co.id AND s.title = 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية'));

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'السلاسل الجبلية الحديثة وعلاقتها بتكتونية الصفائح', 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية', 'text', 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 10
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'السلاسل الجبلية الحديثة وعلاقتها بتكتونية الصفائح');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'التحول وعلاقته بدينامية الصفائح', 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية', 'text', 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 11
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'التحول وعلاقته بدينامية الصفائح');

INSERT INTO lessons (course_id, section_id, title, summary, kind,
                     text_content, duration_seconds, is_preview, position)
SELECT co.id, s.id, 'الكرانيتية وعلاقتها بظاهرة التحول', 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية', 'text', 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية

المصدر: آلوسكول — علوم الحياة والأرض: الثانية باك علوم فيزيائية
الرابط: https://www.alloschool.com/course/alom-alhiaa-oalardh-althania-bak-alom-fiziaiia', 0, 0, 12
  FROM courses co JOIN course_sections s ON s.course_id = co.id
 WHERE co.slug = 'ma-2bac-sp-svt' AND s.title = 'الظواهر الجيولوجية المصاحبة لنشوء السلاسل الجبلية'
   AND NOT EXISTS (SELECT 1 FROM lessons l
                    WHERE l.section_id = s.id AND l.title = 'الكرانيتية وعلاقتها بظاهرة التحول');

