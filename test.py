import doctest
import re
import unittest

import manuel.capture
import manuel.codeblock
import manuel.doctest
import manuel.ignore
import manuel.testing


# monkeypatch to allow hyphens in code-block directive options
manuel.codeblock.CODEBLOCK_START = re.compile(
    r'(^\.\.\s*(invisible-)?code(-block)?::?\s*python\b(?:\s*\:[\w-]+\:.*\n)*)',
    re.MULTILINE)


def tests():
    m = manuel.ignore.Manuel()
    m += manuel.doctest.Manuel(
        optionflags=doctest.ELLIPSIS|doctest.NORMALIZE_WHITESPACE)
    m += manuel.codeblock.Manuel()
    m += manuel.capture.Manuel()
    return manuel.testing.TestSuite(m, r'slides.rst')


if __name__ == '__main__':
    unittest.TextTestRunner().run(tests())
