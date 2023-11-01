import slugify from "slugify";

export const generateSlug = (text: string) => {
  return slugify(text, { lower: true });
};
