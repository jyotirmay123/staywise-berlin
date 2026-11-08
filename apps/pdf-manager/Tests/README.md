# Test strategy

The Command Line Tools installed on the target Mac do not include the XCTest or
Swift Testing modules. The native end-to-end suite therefore lives in the
`PDFManagerE2ETests` executable target and uses explicit throwing assertions.

Run it with:

```bash
./scripts/test.sh
```

The suite creates real PDF, PNG, JPG, and DOCX fixtures under `output/pdf/`,
exercises the core workflows, and leaves the resulting files available for
Poppler rendering and visual review.
