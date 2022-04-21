const { Router } = require("express")
const mongoose = require("mongoose")
const { Article } = require("../models/article")
const { Tag } = require("../models/tag")
const { filterUnique, lowerCase } = require("../utils/helpers")
const slugify = require("slugify")
const { User } = require("../models/user")

const router = Router()

const saveTags = (tags) =>
  Promise.all(
    tags.map(async (tag) => {
      const savedTag = await Tag.findOneAndUpdate(
        { name: tag },
        { $set: { name: tag } },
        { upsert: true, returnDocument: "after" }
      )
      return savedTag._id
    })
  )

const findUniqueSlug = async (slug, identifier = 1) => {
  const slugToTest = identifier === 1 ? slug : slug + "-" + identifier
  const article = await Article.findOne({ slug: slugToTest })
  if (!article) {
    return slugToTest
  } else {
    return await findUniqueSlug(slug, identifier + 1)
  }
}

router.post("/", async (req, res) => {
  const { title, description, body, tagList } = req.body.article
  const { userId } = req.user

  const uniqueTags = filterUnique(tagList).map(lowerCase)
  const tags = await saveTags(uniqueTags)
  const slug = await findUniqueSlug(slugify(title))

  const article = new Article({
    title,
    description,
    body,
    tagList: tags,
    author: userId,
    slug: slug,
  })

  const savedArticle = await article.save()

  res.json({ article: { ...savedArticle.toObject(), favorited: false } })
})

router.get("/", async (req, res) => {
  let query = {}
  let limit = 10
  let offset = 0

  if (typeof req.query.limit !== "undefined") {
    limit = req.query.limit
  }
  if (typeof req.query.offset !== "undefined") {
    offset = req.query.offset
  }
  if (typeof req.query.tag !== "undefined") {
    const tag = await Tag.findOne({ name: req.query.tag })
    query.tagList = tag._id
  }

  if (typeof req.query.favorited !== "undefined") {
    const user = await User.findOne({ username: req.query.favorited })
    query.favoritedBy = user._id
  }

  const author = await User.findOne({ username: req.query.author })

  if (author === null && req.query.author) {
    return res.json({ articles: [], articlesCount: 0 })
  } else if (author) {
    query.author = author._id
  }

  const articles = await Article.find(query)
    .limit(Number(limit))
    .skip(Number(offset))
    .sort({ createdAt: -1 })
    .populate("author")
    .populate("tagList")
    .exec()
  const articlesCount = await Article.count(query).exec()

  const processedArticles = Array.from(articles).map((article) => {
    const processedArticle = {
      ...article.toObject(),
      tagList: article.tagList.map((tag) => tag.name).sort(),
      favorited: article.favoritedBy.includes(req.user?.userId),
    }
    return processedArticle
  })

  res.json({
    articles: processedArticles,
    articlesCount: articlesCount,
  })
})

router.get("/feed", async (req, res) => {
  const user = await User.findById(req.user.userId)
  const limit = req.query.limit
  const offset = req.query.offset
  const articles = await Article.find({ author: { $in: user.follows } })
    .limit(Number(limit))
    .skip(Number(offset))
    .populate("author")
    .populate("tagList")

  const processedArticles = articles.map((article) => {
    return {
      ...article.toObject(),
      tagList: article.tagList.map((tag) => tag.name).sort(),
      favorited: article.favoritedBy.includes(req.user?.userId),
    }
  })
  res.json({ articles: processedArticles, articlesCount: articles.length })
})

router.post("/:slug/favorite", async (req, res) => {
  const { slug } = req.params
  const article = await Article.findOneAndUpdate(
    { slug },
    { $addToSet: { favoritedBy: mongoose.Types.ObjectId(req.user.userId) } },
    { returnDocument: "after" }
  )
  res.json({
    article: {
      ...article.toObject(),
      favorited: true,
    },
  })
})

router.delete("/:slug/favorite", async (req, res) => {
  const { slug } = req.params
  const article = await Article.findOneAndUpdate(
    { slug },
    { $pull: { favoritedBy: req.user.userId } },
    { returnDocument: "after" }
  )
  res.json({
    article: {
      ...article.toObject(),
      favorited: false,
    },
  })
})

router.get("/:slug", async (req, res) => {
  const { slug } = req.params
  const article = await Article.findOne({ slug: slug })
    .populate("author")
    .populate("tagList")
    .exec()

  const processedArticle = {
    ...article.toObject(),
    tagList: article.tagList.map((tag) => tag.name).sort(),
    favorited: article.favoritedBy.includes(req.user?.userId),
  }
  res.json({ article: processedArticle })
})

module.exports = router
