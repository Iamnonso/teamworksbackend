/* eslint-disable consistent-return */
const express = require('express');

const bodyParser = require('body-parser');

const cors = require('cors');

const rateLimit = require('express-rate-limit');

const cloudinary = require('cloudinary').v2;

const { pool } = require('./config');

const helper = require('./helper.js');

const app = express();

// limit the number of request every 1 minute
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

// setup  cloudinary

cloudinary.config({
  cloud_name: 'capstoneproject',
  api_key: '276416446124423',
  api_secret: 'xI9zhOAE6vGu2xMQ8e5N2AK7Wts',
});

app.use(limiter);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// ////////////////////////////////////////// create middleware // /////////////////////////////////

// Admin/Empolyees can login
const login = (request, response) => {
  if (!request.body.email || !request.body.password) {
    return response.status(400).send({ message: 'Some values are missing' });
  }

  if (!helper.isValidEmail(request.body.email)) {
    return response
      .status(400)
      .send({ message: 'Please enter a valid email address' });
  }

  const hashPassword = helper.hashPassword(request.body.password);

  const { email } = request.body;

  pool.query(
    'SELECT * FROM public.employees WHERE email=$1',
    [email],
    (error, results) => {
      if (error) {
        console.log(error);
      }

      if (results) {

        if (helper.comparePassword('$2b$10$fUgtEH4q/Naa8/QaGtIxvOlpCKPzk49CB5t41cjaOZQ8ooXK76eyK', request.body.password) === true) {
          response.status(200).json({
            status: 'success',
            token: helper.generateToken('6s86468s0&$'),
            data: results.rows,
          });
        } else {
          response.status(401).send({ message: 'password does not match any record' });
        }

      }
    },
  );
};

// admin can create user

const createEmployee = (request, response) => {
  if (!request.body.email || !request.body.password) {
    return response
      .status(400)
      .send({ message: 'email and password must be provided' });
  }

  if (!helper.isValidEmail(request.body.email)) {
    return response
      .status(400)
      .send({ message: 'Please enter a valid email address' });
  }

  const hashPassword = helper.hashPassword(request.body.password);

  const userIds = helper.generateuserId();

  const { token } = helper.generateToken('577484EE55BBJJJXXO09EEGD55677889');

  pool.query(
    'INSERT INTO public.employees("firstName", "lastName", email, password, gender, "jobRole", department, adddress, "userId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);',
    [
      request.body.firstName,
      request.body.lastName,
      request.body.email,
      hashPassword,
      request.body.gender,
      request.body.jobRole,
      request.body.department,
      request.body.address,
      userIds,
    ],
    (error, result) => {
      if (error) {
        response.status(400).json({
          error,
        });
      }

      if (result) {
      response.status(201).json({
        status: 'success',
        data: {
          message: 'user successfully created.',
          token: helper.generateToken('5774EE559'),
          userId: userIds,
        },
      });
    }
    },
  );
};

//  post gifs
const shareGits = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  cloudinary.uploader.upload(request.body.image, (error, result) => {
    if (error) {
      response.status(400).json({
        error,
      });
    }

    if (result) {
      const titles = request.body.title;

      const { userId } = request.body;

      const imageUrls = result.secure_url;

      const gifIds = helper.generateuserId();

      const dateCreate = result.created_at;

      pool.query(
        'INSERT INTO public.gifs("gifId", "imageUrl", "userId", "createdOn", title) VALUES ($1, $2, $3, $4, $5)',
        [gifIds, imageUrls, userId, dateCreate, titles],
        (errors) => {
          if (errors) {
            response.status(400).json({
              errors,
            });
          }

          response.status(201).json({
            status: 'success',
            data: {
              gifId: gifIds,
              message: 'GIF image successfully posted',
              createdOn: dateCreate,
              title: titles,
              imageUrl: imageUrls,
            },
          });
        },
      );
    }
  });
};

// create article

const createArticle = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  if (!request.body.title || !request.body.userId) {
    return response
      .status(400)
      .send({
        message:
          'Title can not be empty or userId not include in the body, reference to the repo README for guideline',
      });
  }

  const {
 title, article, userId, category,
} = request.body;

  const articleIds = helper.generateuserId();

  const create = new Date();

  pool.query(
    'INSERT INTO public.article("userId", article, dates, "categoryId", "articleId", title) VALUES ($1, $2, $3, $4, $5)',
    [userId, article, create, category, articleIds, title],
    (errors) => {
      if (errors) {
        response.status(400).json({
          errors,
        });
      }

      response.status(201).json({
        status: 'success',
        data: {
          message: 'Article successfully posted.',
          articleId: articleIds,
          createdOn: create,
          title: request.body.title,
        },
      });
    },
  );
};

// update article

const updateArticle = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  const { title, article, category } = request.body;

  const { articleId } = request.params;

  pool.query(
    'UPDATE public.article SET article=$1, "categoryId"=$2, title=$3 WHERE "articleId"=$4;',
    [article, category, title, articleId],
    (errors) => {
      if (errors) {
        response.status(400).json({
          errors,
        });
      }

      response.status(201).json({
        status: 'success',
        data: {
          message: 'Article successfully updated',
          article,
          articleId,
          title,
        },
      });
    },
  );
};

// delete article

const deleteArticle = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  const { articleId } = request.params;

  const { userId } = request.body;

  if (!articleId) {
    return response.status(400).send({ message: 'invalid request!' });
  }

  if (!userId) {
    return response
      .status(400)
      .send({ messsage: 'Error, Past userid in the request body!' });
  }

  pool.query(
    'DELETE FROM public.article WHERE "articleId"=$1 AND "userId"=$2;',
    [articleId, userId],
    (errors) => {
      if (errors) {
        response.status(400).json({
          errors,
        });
      }

      response.status(201).json({
        status: 'success',
        data: {
          message: 'Article successfully deleted',
        },
      });
    },
  );
};


const commentOnArticle = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  const { userId, articleId, comment } = request.body;

  const commentId = helper.generateuserId;

  const createOn = new Date();

  if (!userId || !articleId || !comment) {
    return response
      .status(400)
      .send({ messsage: 'Pass all require parameter on the body!' });
  }

  pool.query(
    'INSERT INTO public.comments("userId", "articleId", dates, commentid, comment) VALUES ($1, $2, $3, $4, $5);',
    [userId, articleId, createOn, commentId, comment],
    (errors, results) => {
      if (errors) {
        response.status(400).json({
          errors,
        });
      }

      if (results) {
        pool.query(
          'SELECT * FROM public.article WHERE "articleId" = $1',
          [articleId],
          (error, result) => {
            if (error) {
              response.status(400).json({
                errors,
              });
            }

            response.status(201).json({
              status: 'success',
              data: {
                message: 'comment created successfully',
                createdOn: createOn,
                articleTitle: result.rows[0].title,
                article: result.row[0].article,
                comment: request.body.comment,
              },
            });
          },
        );
      }
    },
  );
};

// delete Gifs

const deleteGifs = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  const { gifId } = request.params;

  const { userId } = request.body;

  if (!gifId) {
    return response.status(400).send({ message: 'invalid request!' });
  }

  if (!userId) {
    return response
      .status(400)
      .send({ messsage: 'Error, Pass userid in the request body!' });
  }

  pool.query(
    'DELETE FROM public.gifs WHERE "gifId"=$1 AND "userId"=$2;',
    [gifId, userId],
    (errors) => {
      if (errors) {
        response.status(400).json({
          errors,
        });
      }

      response.status(201).json({
        status: 'success',
        data: {
          message: 'Gif successfully deleted',
        },
      });
    },
  );
};

// user can comment on gif

const commentOnGif = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  const { userId, gifId, comment } = request.body;

  const commentId = helper.generateuserId;

  const createOn = new Date();

  if (!userId || !gifId || !comment) {
    return response
      .status(400)
      .send({ messsage: 'Pass all required parameter on the body!' });
  }

  pool.query(
    'INSERT INTO public.comments("userId", "articleId", dates, commentid, comment) VALUES ($1, $2, $3, $4, $5);',
    [userId, gifId, createOn, commentId, comment],
    (errors, results) => {
      if (errors) {
        response.status(400).json({
          errors,
        });
      }

      if (results) {
        pool.query(
          'SELECT * FROM public.gifs WHERE "gifId" = $1',
          [gifId],
          (error, result) => {
            if (error) {
              response.status(400).json({
                error,
              });
            }

            response.status(201).json({
              status: 'success',
              data: {
                message: 'comment created successfully',
                createdOn: createOn,
                gifTitle: result.rows[0].title,
                gifImage: result.rows[0].imageUrl,
                comment: request.body.comment,
              },
            });
          },
        );
      }
    },
  );
};

// gif feeds

const gifFeed = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  pool.query('SELECT * FROM public.gifs', (error, result) => {
    if (error) {
      response.status(400).json({
        error,
      });
    }

    response.status(201).json({
      status: 'success',
      data: result.rows,
    });
  });
};

// article feeds

const articleFeed = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  pool.query('SELECT * FROM public.article', (error, result) => {
    if (error) {
      response.status(400).json({
        error,
      });
    }

    response.status(201).json({
      status: 'success',
      data: result.rows,
    });
  });
};

// user view speci gif feed

const viewGif = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  const { gifId } = request.params;

  if (!gifId) {
    return response.status(401).send({ message: 'invaild request' });
  }

  pool.query(
    'SELECT * FROM public.gifs WHERE "gifId"=$1;',
    [gifId],
    (error, result) => {
      if (error) {
        response.status(400).json({
          error,
        });
      }

      response.status(201).json({
        status: 'success',
        data: result.rows,
      });
    },
  );
};

// user can view spec article

const viewArticle = (request, response) => {
  if (!request.header('token')) {
    return response.status(401).send({ message: 'authorization denied' });
  }

  const { articleId } = request.params;

  if (!articleId) {
    return response.status(401).send({ message: 'invaild request' });
  }

  pool.query(
    'SELECT * FROM public.article WHERE "articleId"=$1;',
    [articleId],
    (error, result) => {
      if (error) {
        response.status(400).json({
          error,
        });
      }

      if (result.rows[0].id === '') {
        return response
          .status(401)
          .send({ message: 'article not available or deleted' });
      }
        response.status(201).json({
          status: 'success',
          data: result.rows,
        });

    },
  );
};

//set index page message
const indexPage = (request, response) => {
  response.status(200).send({ message: 'Welcome to teamwork capstone project v1.0, vist the respo @ my github page teamworksbackend@iamnonso, remember to star the project'});
}

app.get('/', indexPage);
app.get('/api/v1/auth/signin', login);
app.post('/api/v1/auth/create-user', createEmployee);
app.post('/api/v1/user/gifs', shareGits);
app.post('/api/v1/article', createArticle);
app.patch('/api/v1/article/:articleId', updateArticle);
app.delete('/api/v1/article/:articleId', deleteArticle);
app.delete('/api/v1/gif/:gifId', deleteGifs);
app.post('/api/v1/articles/comment', commentOnArticle);
app.post('/api/v1/gif/comment', commentOnGif);
app.get('/api/v1/gifs/feeds', gifFeed);
app.get('/api/v1/articles/feeds', articleFeed);
app.get('/api/v1/gif/:gifId', viewGif);
app.get('/api/v1/article/:articleId', viewArticle);

module.exports = app;
