Use youlearn;
CREATE TABLE Roles
(
    id INT AUTO_INCREMENT ,
    name VARCHAR(500) ,
    PRIMARY KEY (id)
);
DESCRIBE User;
CREATE TABLE User
(
    id INT AUTO_INCREMENT ,
    role_id INT ,
    name VARCHAR(500) ,
    email VARCHAR(500) Unique ,
    password VARCHAR(500) ,
    isActive bool,
    PRIMARY KEY (id) ,
    foreign key (role_id) REFERENCES Roles(id) ON UPDATE CASCADE
    ON DELETE CASCADE
);
CREATE TABLE Categories
(
    id INT AUTO_INCREMENT ,
    name VARCHAR(500) UNIQUE ,
    PRIMARY KEY (id)
);

CREATE TABLE Tags
(
    id INT AUTO_INCREMENT ,
    title VARCHAR(500) UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE CoursTags
(
    id INT AUTO_INCREMENT ,
    tag_id INT NOT NULL ,
    cours_id INT NOT NULL,
    foreign key (tag_id) REFERENCES Tags(id) ON UPDATE cascade
    ON DELETE cascade ,
    foreign key (cours_id) REFERENCES Cours(id) ON UPDATE cascade
    ON DELETE cascade,
    PRIMARY KEY (id)
);
Alter table Cours ADD COLUMN contenttype VARCHAR(500);
CREATE TABLE Cours
(
    id INT AUTO_INCREMENT ,
    title VARCHAR(500) UNIQUE ,
    subtitle VARCHAR(500),
    instructor VARCHAR(500),
    img TEXT,
    isprojected BOOLEAN,
    price FLOAT,
    description TEXT,
    contenttype VARCHAR(500),
    content TEXT,
    cat_id INT ,
    foreign key (cat_id) REFERENCES Categories(id) ON UPDATE cascade
        ON DELETE SET NULL ,
    foreign key (tags) REFERENCES Tags(id) ON UPDATE cascade
        ON DELETE SET NULL,
    PRIMARY KEY (id)
);
CREATE TABLE Inscription
(
    user_id INT ,
    cour_id INT ,
    date DATE,
    foreign key (user_id) REFERENCES User(id) ON UPDATE cascade
        ON DELETE cascade ,
    foreign key (cour_id) REFERENCES Cours(id) ON UPDATE cascade
        ON DELETE cascade,
    PRIMARY KEY (user_id , cour_id)
);

INSERT INTO Roles (name) VALUES
                             ('admin'),
                             ('enseignant'),
                             ('etudiant');

INSERT INTO Categories (name) VALUES
                                  ('Développement Web'),
                                  ('Marketing Digital'),
                                  ('Design Graphique'),
                                  ('Langues'),
                                  ('Business & Entrepreneuriat'),
                                  ('Développement Personnel');

INSERT INTO Tags (title) VALUES
                             ('HTML/CSS'),
                             ('JavaScript'),
                             ('PHP'),
                             ('SEO'),
                             ('Adobe Photoshop'),
                             ('Social Media'),
                             ('WordPress'),
                             ('UI/UX'),
                             ('Débutant'),
                             ('Avancé'),
                             ('Marketing Analytics'),
                             ('E-commerce'),
                             ('Gestion de Projet'),
                             ('Communication'),
                             ('Productivité');


INSERT INTO Cours (title, description, content, cat_id) VALUES
                                                            ('Formation Complète Développeur Web 2024',
                                                             'Devenez développeur web fullstack en partant de zéro. Apprenez HTML, CSS, JavaScript, PHP et MySQL.',
                                                             'Module 1: Introduction au HTML...\nModule 2: Styling avec CSS...\nModule 3: JavaScript Moderne...',
                                                             1),

                                                            ('Marketing Digital : De Zéro à Expert',
                                                             'Maîtrisez les fondamentaux du marketing digital et créez des campagnes performantes.',
                                                             'Chapitre 1: Introduction au Marketing Digital...\nChapitre 2: SEO Fondamental...',
                                                             2),

                                                            ('Maîtrisez Photoshop CC 2024',
                                                             'Formation complète sur Adobe Photoshop CC. Du débutant au professionnel.',
                                                             'Partie 1: Interface et outils de base...\nPartie 2: Techniques avancées...',
                                                             3),

                                                            ('WordPress pour les Entrepreneurs',
                                                             'Créez et gérez votre site professionnel avec WordPress sans coder.',
                                                             'Section 1: Installation de WordPress...\nSection 2: Personnalisation...',
                                                             1),

                                                            ('Anglais des Affaires',
                                                             'Améliorez votre anglais professionnel pour exceller dans le monde des affaires.',
                                                             'Leçon 1: Vocabulaire professionnel...\nLeçon 2: Conversations Business...',
                                                             4),

                                                            ('Création d''Entreprise de A à Z',
                                                             'Guide complet pour lancer votre entreprise en France.',
                                                             'Module 1: Étude de marché...\nModule 2: Business Plan...',
                                                             5);

INSERT INTO CoursTags (tag_id, cours_id) VALUES
                                             (1, 1),
                                             (2, 1),
                                             (3, 1),
                                             (9, 1),
                                             (4, 2),
                                             (6, 2),
                                             (11, 2),
                                             (5, 3),
                                             (8, 3),
                                             (10, 3),
                                             (7, 4),
                                             (12, 4),
                                             (9, 4),
                                             (14, 5),
                                             (13, 6);



SELECT DISTINCT c.id FROM Inscription i  
            JOIN (SELECT * FROM `Cours` cc WHERE cc.instructor = 8) c ON c.id = i.cour_id
            JOIN User u ON  u.id=i.user_id;

SELECT c.id , u.name , u.email, i.`date` FROM Inscription i  
            JOIN (SELECT * FROM `Cours` cc WHERE cc.instructor = 8) c ON c.id = i.cour_id
            JOIN User u ON  u.id=i.user_id WHERE i.cour_id=


SELECT c.id , c.title ,c.subtitle , c.description , c.cat_id ,c.content , c.contenttype , c.img , c.price , c.isprojected , u.name as instructor FROM Cours c 
JOIN `Inscription` i on i.cour_id = c.id  
JOIN `User` u ON u.id = i.user_id 
GROUP BY i.cour_id  