# Recyclr

Port of sunsetted RecycleMe project built for Emerson College Environment and Sustainability Department. The purpose of the game was to inform students about on-campus recycling and composting.

## Prereqs

This project assumes you have: 
- A mongo db v2.6 instance running somewhere and its connection string
- A cloudinary account & content for data images

## How To Run

1. `yarn install`
2. `yarn run serve`

## Environment

```
ENV=<development|production>
MONGODB_URI=<mongo connection string>
CLOUDINARY_NAME=<name>
CLOUDINARY_KEY=<key>
CLOUDINARY_SECRET=<secret>
```