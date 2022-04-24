# recipe parser

> This is work in progress.

This recipe parser currently parses lists of ingredients with optional sections. For example, the parser will parse

```text
dough
1 1/2 cp all-purpose flour
1 tsp vanilla extract,
sauce
1 cup milk
1 egg
```

into a JSON object

```json
{
  "type": "ingredients",
  "ingredients": [
    {
      "amount": {
        "quantity": 1.5,
        "unit": "cup"
      },
      "ingredient": "all-purpose flour",
      "section": "dough"
    },
    {
      "amount": {
        "quantity": 1,
        "unit": "tsp"
      },
      "ingredient": "vanilla extract",
      "section": "dough"
    },
    {
      "amount": {
        "quantity": 1,
        "unit": "cup"
      },
      "ingredient": "milk",
      "section": "sauce"
    },
    {
      "amount": {
        "quantity": 1,
        "unit": "piece"
      },
      "ingredient": "egg",
      "section": "sauce"
    }
  ]
}
```